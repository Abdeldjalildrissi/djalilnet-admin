import { NextRequest } from "next/server"
import { db } from "@/db"
import { activityLogs, users } from "@/db/schema"
import { desc, eq, sql } from "drizzle-orm"
import { requireRole } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  // Only super_admin and editor can view audit logs
  const session = await requireRole(request, ["super_admin", "editor"])
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") || "50")
  const offset = parseInt(searchParams.get("offset") || "0")

  try {
    const logs = await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        resourceType: activityLogs.resourceType,
        resourceId: activityLogs.resourceId,
        metadata: activityLogs.metadata,
        ipAddress: activityLogs.ipAddress,
        createdAt: activityLogs.createdAt,
        user: {
          name: users.name,
          email: users.email,
        }
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset)

    return Response.json(logs)
  } catch (error) {
    console.error("Failed to fetch activity logs:", error)
    return Response.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}
