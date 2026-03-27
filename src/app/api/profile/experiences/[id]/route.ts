/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { experiences } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireRole } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const item = await db.query.experiences.findFirst({
      where: eq(experiences.id, id),
    })
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch experience" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole(request, ["super_admin", "editor"])
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    
    // Explicitly mapping allowed fields only
    const { company, role, period, location, current, bullets, order } = body
    
    const [updated] = await db.update(experiences)
      .set({
        company,
        role,
        period,
        location,
        current,
        bullets,
        order,
        updatedAt: new Date(),
      })
      .where(eq(experiences.id, id))
      .returning()

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await logActivity({
      userId: session.user.id,
      action: "profile.experience.update",
      resourceId: updated.id,
      resourceType: "experience",
      metadata: { company: updated.company, role: updated.role, ...body }
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update experience" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole(request, ["super_admin", "editor"])
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const [deleted] = await db.delete(experiences)
      .where(eq(experiences.id, id))
      .returning()

    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await logActivity({
      userId: session.user.id,
      action: "profile.experience.delete",
      resourceId: id,
      resourceType: "experience",
      metadata: { company: deleted.company }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE experience error:", error)
    return NextResponse.json({ error: "Failed to delete experience" }, { status: 500 })
  }
}
