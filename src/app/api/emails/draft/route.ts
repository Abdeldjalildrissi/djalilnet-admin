import { NextRequest } from "next/server"
import { db } from "@/db"
import { emails } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"
import { z } from "zod"
import { htmlToText } from "@/lib/utils"
import { FROM_EMAIL } from "@/lib/resend"

export async function POST(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as { role?: string }).role
  if (!["super_admin", "editor"].includes(role ?? "")) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()

  const draftSchema = z.object({
    from: z.string().email().optional(),
    to: z.union([z.string(), z.array(z.string())]).optional().nullable(),
    cc: z.array(z.string()).optional(),
    subject: z.string().optional(),
    bodyHtml: z.string().optional(),
    templateId: z.string().uuid().optional().nullable(),
    draftId: z.string().uuid().optional(),
    attachments: z.array(z.object({
      filename: z.string(),
      url: z.string().url(),
      size: z.number().optional()
    })).optional(),
  })

  const parsed = draftSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 422 })
  }

  const { from, to, cc, subject, bodyHtml, templateId, draftId, attachments } = parsed.data
  const toArray = to ? (Array.isArray(to) ? to : [to]) : []
  const finalHtml = bodyHtml || ""
  const att = attachments || []
  const finalFrom = from || FROM_EMAIL

  if (draftId) {
    const [updatedEmail] = await db.update(emails)
      .set({
        toAddress: toArray.join(", "),
        ccAddresses: cc?.join(", "),
        subject: subject || "(No Subject)",
        bodyHtml: finalHtml,
        bodyText: htmlToText(finalHtml),
        templateId: templateId ?? null,
        attachments: att,
      })
      .where(eq(emails.id, draftId))
      .returning()
    return Response.json({ data: updatedEmail }, { status: 200 })
  } else {
    const [newDraft] = await db.insert(emails)
      .values({
        direction: "outbound",
        fromAddress: finalFrom,
        toAddress: toArray.join(", "),
        ccAddresses: cc?.join(", "),
        subject: subject || "(No Subject)",
        bodyHtml: finalHtml,
        bodyText: htmlToText(finalHtml),
        status: "draft",
        sentById: session.user.id,
        templateId: templateId ?? null,
        attachments: att,
      })
      .returning()
    return Response.json({ data: newDraft }, { status: 201 })
  }
}
