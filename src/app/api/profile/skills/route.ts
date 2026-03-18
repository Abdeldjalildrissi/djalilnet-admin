import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { skills } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { requireRole } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"

export async function GET(request: NextRequest) {
  try {
    const data = await db.query.skills.findMany({
      orderBy: [asc(skills.category), asc(skills.order)],
    })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireRole(request, ["super_admin", "editor"])
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const [newItem] = await db.insert(skills).values({
      name: body.name,
      category: body.category,
      level: body.level,
      order: body.order ?? 0,
    }).returning()

    await logActivity({
      userId: session.user.id,
      action: "profile.skill.create",
      resourceId: newItem.id,
      resourceType: "skill",
      metadata: { name: newItem.name, category: newItem.category }
    })

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create skill" }, { status: 500 })
  }
}
