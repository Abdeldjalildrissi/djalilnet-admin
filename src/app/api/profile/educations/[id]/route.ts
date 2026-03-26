/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { educations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireRole } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const item = await db.query.educations.findFirst({
      where: eq(educations.id, id),
    })
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch education" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole(request, ["super_admin", "editor"])
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    
    // Explicitly mapping allowed fields only
    const { degree, school, period, order } = body
    
    const [updated] = await db.update(educations)
      .set({
        degree,
        school,
        period,
        order,
      })
      .where(eq(educations.id, id))
      .returning()

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await logActivity({
      userId: session.user.id,
      action: "profile.education.update",
      resourceId: updated.id,
      resourceType: "education",
      metadata: { degree: updated.degree, school: updated.school, ...body }
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update education" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole(request, ["super_admin", "editor"])
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const [deleted] = await db.delete(educations)
      .where(eq(educations.id, id))
      .returning()

    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await logActivity({
      userId: session.user.id,
      action: "profile.education.delete",
      resourceId: id,
      resourceType: "education",
      metadata: { degree: deleted.degree }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete education" }, { status: 500 })
  }
}
