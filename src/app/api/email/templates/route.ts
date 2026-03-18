import { NextRequest } from "next/server"
import { db } from "@/db"
import { emailTemplates } from "@/db/schema"
import { requireAuth } from "@/lib/auth-helpers"
import { createTemplateSchema } from "@/lib/validations/email"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const data = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.isActive, true))
    .orderBy(emailTemplates.name)

  return Response.json({ data })
}

export async function POST(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = createTemplateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const [template] = await db
    .insert(emailTemplates)
    .values({
      name: parsed.data.name,
      subject: parsed.data.subject,
      bodyHtml: parsed.data.bodyHtml,
      bodyText: parsed.data.bodyText,
      variables: parsed.data.variables,
      createdById: session.user.id,
    })
    .returning()

  return Response.json({ data: template }, { status: 201 })
}
