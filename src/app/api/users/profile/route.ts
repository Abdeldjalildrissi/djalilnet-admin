import { NextRequest } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"

export async function PATCH(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { name, image } = body

  if (!name && !image) {
    return Response.json({ error: "At least one field (name or image) is required" }, { status: 400 })
  }

  const updateData: any = {}
  if (name) updateData.name = name
  if (image) updateData.image = image
  updateData.updatedAt = new Date()

  try {
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning()

    if (!updatedUser) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Log the activity
    await logActivity({
      action: "user.update_profile",
      resourceType: "user",
      resourceId: session.user.id,
      userId: session.user.id,
      metadata: { fields: Object.keys(updateData) }
    })

    return Response.json(updatedUser)
  } catch (error) {
    console.error("Failed to update profile:", error)
    return Response.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
