import { NextRequest } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { requireRole } from "@/lib/auth-helpers"
import { z } from "zod"

const updateUserSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["super_admin", "editor", "author"]).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  // Only super_admin and editor can list users
  const session = await requireRole(request, ["super_admin", "editor"])
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt))
  
  return Response.json(allUsers)
}

export async function PATCH(request: NextRequest) {
  // Only super_admin can update user roles/status
  const session = await requireRole(request, ["super_admin"])
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = updateUserSchema.safeParse(await request.json())
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }
  const { id, role, isActive } = parsed.data

  const updateData: Record<string, unknown> = {}
  if (role) updateData.role = role
  if (typeof isActive === "boolean") updateData.isActive = isActive
  updateData.updatedAt = new Date()

  try {
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning()

    if (!updatedUser) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    return Response.json(updatedUser)
  } catch (error) {
    console.error("Failed to update user:", error)
    return Response.json({ error: "Failed to update user" }, { status: 500 })
  }
}
