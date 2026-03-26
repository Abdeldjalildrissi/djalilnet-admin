/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { experiences } from "@/db/schema"
import { eq, asc, desc } from "drizzle-orm"
import { requireRole } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"

// GET /api/profile/experiences
export async function GET(request: NextRequest) {
  try {
    const data = await db.query.experiences.findMany({
      orderBy: [asc(experiences.order), desc(experiences.createdAt)],
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error("GET experiences error:", error)
    return NextResponse.json({ error: "Failed to fetch experiences" }, { status: 500 })
  }
}

// POST /api/profile/experiences
export async function POST(request: NextRequest) {
  const session = await requireRole(request, ["super_admin", "editor"])
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const [newItem] = await db.insert(experiences).values({
      company: body.company,
      role: body.role,
      period: body.period,
      location: body.location,
      current: body.current ?? false,
      bullets: body.bullets ?? [],
      order: body.order ?? 0,
    }).returning()

    await logActivity({
      userId: session.user.id,
      action: "profile.experience.create",
      resourceId: newItem.id,
      resourceType: "experience",
      metadata: { company: newItem.company, role: newItem.role }
    })

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    console.error("POST experiences error:", error)
    return NextResponse.json({ error: "Failed to create experience" }, { status: 500 })
  }
}
