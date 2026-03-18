import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { siteSettings } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireRole } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"

export async function GET(request: NextRequest) {
  try {
    const data = await db.query.siteSettings.findMany()
    // Return as a key-value object for easier consumption
    const settings = data.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, unknown>)
    
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireRole(request, ["super_admin"])
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const entries = Object.entries(body)
    
    const results = []
    for (const [key, value] of entries) {
      const [updated] = await db.insert(siteSettings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value, updatedAt: new Date() }
        })
        .returning()
      results.push(updated)
    }

    await logActivity({
      userId: session.user.id,
      action: "profile.settings.update",
      metadata: { keys: Object.keys(body) }
    })

    return NextResponse.json({ success: true, count: results.length })
  } catch (error) {
    console.error("PATCH settings error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
