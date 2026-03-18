import { NextRequest } from "next/server"
import { db } from "@/db"
import { emails, emailTemplates } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"
import { FROM_EMAIL } from "@/lib/resend"
import { mergeTemplateVariables, htmlToText } from "@/lib/utils"
import { queue } from "@/lib/email-queue"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { z } from "zod"

export const dynamic = "force-dynamic"

let ratelimit: Ratelimit | null = null

function getRatelimit() {
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
    })
  }
  return ratelimit
}

const bulkEmailSchema = z.object({
  recipients: z.array(z.string().email()).min(1).max(500), // Max 500 per batch
  subject: z.string().min(1).max(500),
  bodyHtml: z.string().min(1),
  templateId: z.string().uuid().optional(),
  variables: z.record(z.string(), z.string()).optional(),
})

// Utility chunk array function
const chunk = <T>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )

export async function POST(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
  const { success } = await getRatelimit().limit(ip)
  if (!success) {
    return Response.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
  }

  const role = (session.user as { role?: string }).role
  if (!["super_admin", "editor"].includes(role ?? "")) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = bulkEmailSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { recipients, subject, bodyHtml, templateId } = parsed.data
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

  // To properly track each email individually:
  const dbRecords = recipients.map((email) => ({
    direction: "outbound" as const,
    fromAddress: FROM_EMAIL,
    toAddress: email,
    subject,
    bodyHtml: finalHtml,
    bodyText: htmlToText(finalHtml),
    status: "draft" as const,
    sentById: session.user.id,
    templateId: templateId ?? null,
  }))

  const insertedEmails = await db.insert(emails).values(dbRecords).returning()

  // Split into batches of 50 to avoid hitting limits
  const batches = chunk(insertedEmails, 50)
  
  const jobs = batches.flatMap((batch, batchIndex) =>
    batch.map((emailRec, i) => ({
      name: "send",
      data: {
        to: emailRec.toAddress,
        subject: emailRec.subject,
        html: emailRec.bodyHtml,
        emailId: emailRec.id,
      },
      // Stagger sends: 1 second per batch, slight variance per email within batch
      opts: { delay: batchIndex * 1000 + i * 20, priority: 2 },
    }))
  )

  await queue.addBulk(jobs)

  logActivity({
    userId: session.user.id,
    action: "email.bulk_send",
    metadata: { count: recipients.length, subject },
  })

  return Response.json({ queued: recipients.length }, { status: 201 })
}
