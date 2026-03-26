/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { educations } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { requireRole } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"

export async function GET(request: NextRequest) {
  try {
    const data = await db.query.educations.findMany({
      orderBy: [asc(educations.order)],
    })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch educations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireRole(request, ["super_admin", "editor"])
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const [newItem] = await db.insert(educations).values({
      degree: body.degree,
      school: body.school,
      period: body.period,
      order: body.order ?? 0,
    }).returning()

    await logActivity({
      userId: session.user.id,
      action: "profile.education.create",
      resourceId: newItem.id,
      resourceType: "education",
      metadata: { degree: newItem.degree, school: newItem.school }
    })

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create education" }, { status: 500 })
  }
}
