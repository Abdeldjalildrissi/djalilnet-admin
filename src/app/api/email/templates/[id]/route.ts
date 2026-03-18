import { NextRequest } from "next/server"
import { db } from "@/db"
import { emailTemplates } from "@/db/schema"
import { requireAuth } from "@/lib/auth-helpers"
import { createTemplateSchema } from "@/lib/validations/email"
import { eq } from "drizzle-orm"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const parsed = createTemplateSchema.partial().safeParse(body)
  
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const [template] = await db
    .update(emailTemplates)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(emailTemplates.id, id))
    .returning()

  if (!template) {
    return Response.json({ error: "Template not found" }, { status: 404 })
  }

  return Response.json({ data: template })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  
  // Soft delete
  await db
    .update(emailTemplates)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(emailTemplates.id, id))

  return Response.json({ success: true })
}
