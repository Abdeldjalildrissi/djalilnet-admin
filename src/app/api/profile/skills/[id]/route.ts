/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { skills } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireRole } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole(request, ["super_admin", "editor"])
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    
    // Explicitly mapping allowed fields only
    const { name, level, category, order } = body
    
    const [updated] = await db.update(skills)
      .set({
        name,
        level,
        category,
        order,
      })
      .where(eq(skills.id, id))
      .returning()

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await logActivity({
      userId: session.user.id,
      action: "profile.skill.update",
      resourceId: updated.id,
      resourceType: "skill",
      metadata: { name: updated.name, ...body }
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update skill" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole(request, ["super_admin", "editor"])
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const [deleted] = await db.delete(skills)
      .where(eq(skills.id, id))
      .returning()

    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await logActivity({
      userId: session.user.id,
      action: "profile.skill.delete",
      resourceId: id,
      resourceType: "skill",
      metadata: { name: deleted.name }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete skill" }, { status: 500 })
  }
}
