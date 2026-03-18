import { NextRequest } from "next/server"
import { db } from "@/db"
import { emails } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const [updated] = await db
    .update(emails)
    .set({ isRead: true })
    .where(eq(emails.id, id))
    .returning()

  return Response.json({ data: updated })
}
