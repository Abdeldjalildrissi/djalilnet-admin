import { NextRequest } from "next/server"
import { db } from "@/db"
import { emailSenders } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"
import * as z from "zod"

const senderSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const json = await request.json()
    const body = senderSchema.parse(json)

    const [updatedSender] = await db
      .update(emailSenders)
      .set(body)
      .where(eq(emailSenders.id, id))
      .returning()

    if (!updatedSender) {
      return Response.json({ error: "Sender not found" }, { status: 404 })
    }

    return Response.json({ data: updatedSender })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 })
    }
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await db.delete(emailSenders).where(eq(emailSenders.id, id))
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
