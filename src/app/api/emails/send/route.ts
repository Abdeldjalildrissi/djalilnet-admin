import { NextRequest } from "next/server"
import { db } from "@/db"
import { emails, emailTemplates } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"
import { sendEmailSchema } from "@/lib/validations/email"
import { FROM_EMAIL } from "@/lib/resend"
import { mergeTemplateVariables, htmlToText } from "@/lib/utils"
import { queue } from "@/lib/email-queue"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
})

export async function POST(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
  const { success } = await ratelimit.limit(ip)
  if (!success) {
    return Response.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
  }

  const role = (session.user as { role?: string }).role
  if (!["super_admin", "editor"].includes(role ?? "")) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = sendEmailSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { to, cc, subject, bodyHtml, templateId, attachments } = parsed.data
  let finalHtml = bodyHtml

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

  const [sentEmail] = await db
    .insert(emails)
    .values({
      direction: "outbound",
      fromAddress: FROM_EMAIL,
      toAddress: toArray.join(", "),
      ccAddresses: cc?.join(", "),
      subject,
      bodyHtml: finalHtml,
      bodyText: htmlToText(finalHtml),
      status: "draft", // Pending queue
      sentById: session.user.id,
      templateId: templateId ?? null,
    })
    .returning()

  // Enqueue job
  await queue.add("send", {
    to: toArray,
    cc: cc ?? [],
    subject,
    html: finalHtml,
    emailId: sentEmail.id,
    attachments: attachments?.map(a => ({ filename: a.filename, path: a.url })),
  }, { priority: 1 })

  logActivity({
    userId: session.user.id,
    action: "email.send",
    resourceId: sentEmail.id,
    resourceType: "email",
    metadata: { to, subject },
  })

  return Response.json({ data: sentEmail }, { status: 201 })
}
