import { NextRequest } from "next/server"
import { db } from "@/db"
import { emails, emailTemplates } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"
import { sendEmailSchema } from "@/lib/validations/email"
import { resend, FROM_EMAIL } from "@/lib/resend"
import { mergeTemplateVariables, htmlToText } from "@/lib/utils"

export async function POST(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as { role?: string }).role
  if (!["super_admin", "editor"].includes(role ?? "")) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = sendEmailSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { to, cc, subject, bodyHtml, templateId } = parsed.data
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

  const { data: resendData, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toArray,
    cc: cc ?? [],
    subject,
    html: finalHtml,
    text: htmlToText(finalHtml),
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const [sentEmail] = await db
    .insert(emails)
    .values({
      direction: "outbound",
      fromAddress: "contact@djalilnet.com",
      toAddress: toArray.join(", "),
      ccAddresses: cc?.join(", "),
      subject,
      bodyHtml: finalHtml,
      bodyText: htmlToText(finalHtml),
      status: "sent",
      resendId: resendData!.id,
      sentAt: new Date(),
      sentById: session.user.id,
      templateId: templateId ?? null,
    })
    .returning()

  logActivity({
    userId: session.user.id,
    action: "email.send",
    resourceId: sentEmail.id,
    resourceType: "email",
    metadata: { to, subject },
  })

  return Response.json({ data: sentEmail }, { status: 201 })
}
