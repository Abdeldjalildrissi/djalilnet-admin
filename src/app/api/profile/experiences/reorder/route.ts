import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { experiences } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireRole } from "@/lib/auth-helpers"

export async function PUT(request: NextRequest) {
  const session = await requireRole(request, ["super_admin", "editor"])
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { items } = await request.json()
    // items should be [{ id: string, order: number }, ...]

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 })
    }

    // Using a simple loop to update the order of each item. 
    // For large tables, a bulk update via raw SQL or `CASE` would be better, 
    // but for user experiences (usually <20 items), sequential is perfectly fine.
    
    // We update all in parallel.
    await Promise.all(
      items.map((item) => 
        db.update(experiences)
          .set({ order: item.order })
          .where(eq(experiences.id, item.id))
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reorder experiences error:", error)
    return NextResponse.json({ error: "Failed to reorder experiences" }, { status: 500 })
  }
}
