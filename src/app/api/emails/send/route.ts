/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server"
import { db } from "@/db"
import { emails, emailTemplates, emailQueue } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"
import { sendEmailSchema } from "@/lib/validations/email"
import { resend, FROM_EMAIL } from "@/lib/resend"
import { mergeTemplateVariables, htmlToText } from "@/lib/utils"
import { queue } from "@/lib/email-queue"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

export const dynamic = "force-dynamic"

let ratelimit: Ratelimit | null = null

function getRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  
  if (!ratelimit) {
    try {
      ratelimit = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "1 m"),
      })
    } catch (e) {
      console.warn("Failed to initialize ratelimit:", e)
      return null
    }
  }
  return ratelimit
}

export async function POST(request: NextRequest) {
  const session = await requireAuth(request)
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"

  const rl = getRatelimit()
  if (rl) {
    const { success } = await rl.limit(ip)
    if (!success) {
      return Response.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
    }
  }

  const role = (session.user as { role?: string }).role
  if (!["super_admin", "editor"].includes(role ?? "")) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = sendEmailSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input"
    return Response.json({ error: message }, { status: 422 })
  }

  const { from, to, cc, subject, bodyHtml, templateId, attachments, draftId } = parsed.data
  let finalHtml = bodyHtml
  const finalFrom = from || FROM_EMAIL

  if (templateId) {
    const template = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.id, templateId),
    })
    if (template) {
      finalHtml = mergeTemplateVariables(
        template.bodyHtml,
        (parsed.data.variables ?? {}) as Record<string, string>
      )
    }
  }

  const toArray = Array.isArray(to) ? to : [to]

  let sentEmail;
  if (draftId) {
    const [updatedEmail] = await db.update(emails)
      .set({
        toAddress: toArray.join(", "),
        ccAddresses: cc?.join(", "),
        subject,
        bodyHtml: finalHtml,
        bodyText: htmlToText(finalHtml),
        status: "draft",
        templateId: templateId ?? null,
        attachments: attachments ?? [],
      })
      .where(eq(emails.id, draftId))
      .returning()
    sentEmail = updatedEmail;
  } else {
    const [newEmail] = await db
      .insert(emails)
      .values({
        direction: "outbound",
        fromAddress: finalFrom,
        toAddress: toArray.join(", "),
        ccAddresses: cc?.join(", "),
        subject,
        bodyHtml: finalHtml,
        bodyText: htmlToText(finalHtml),
        status: "draft",
        sentById: session.user.id,
        templateId: templateId ?? null,
        attachments: attachments ?? [],
      })
      .returning()
    sentEmail = newEmail;
  }

  // Enqueue in DB for history/audit
  const [queueItem] = await db.insert(emailQueue).values({
    toAddress: toArray.join(", "),
    subject,
    bodyHtml: finalHtml,
    status: "pending",
    templateId: templateId ?? null,
  }).returning()

  // Immediate delivery (Standard for Hobby plan)
  try {
    const { data, error } = await resend.emails.send({
      from: finalFrom,
      to: toArray,
      cc: cc ?? [],
      subject,
      html: finalHtml,
      text: htmlToText(finalHtml),
      headers: {
        "X-Entity-Ref-ID": `${Date.now()}-${session.user.id}`,
      },
      attachments: attachments?.map(a => ({ filename: a.filename, path: a.url })),
    })

    if (error) throw new Error(error.message)

    const [updatedEmail] = await db.update(emails)
      .set({ status: "sent", resendId: data!.id, sentAt: new Date() })
      .where(eq(emails.id, sentEmail.id))
      .returning()

    await db.update(emailQueue)
      .set({ status: "completed", processedAt: new Date() })
      .where(eq(emailQueue.id, queueItem.id))

    logActivity({
      userId: session.user.id,
      action: "email.send",
      resourceId: updatedEmail.id,
      resourceType: "email",
      metadata: { to, subject },
    })

    return Response.json({ data: updatedEmail }, { status: 201 })

  } catch (err: any) {
    console.error("[SendAPI] Immediate send failed, item remains pending in queue:", err)
    
    const [failedEmail] = await db.update(emails)
      .set({ status: "failed", failureReason: err.message })
      .where(eq(emails.id, sentEmail.id))
      .returning()
    
    await db.update(emailQueue)
      .set({ status: "failed", error: err.message })
      .where(eq(emailQueue.id, queueItem.id))

    return Response.json({ 
      error: err.message || "Failed to send email",
      data: failedEmail 
    }, { status: 500 })
  }
}
