import { NextRequest } from "next/server"
import { db } from "@/db"
import { activityLogs, users } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { requireRole } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  // Only super_admin can export audit logs
  const session = await requireRole(request, ["super_admin"])
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const logs = await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        resourceType: activityLogs.resourceType,
        resourceId: activityLogs.resourceId,
        ipAddress: activityLogs.ipAddress,
        createdAt: activityLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(1000) // Reasonable limit for CSV export

    // Create CSV content
    const headers = ["ID", "DATE", "USER", "EMAIL", "ACTION", "RESOURCE TYPE", "RESOURCE ID", "IP address"]
    const rows = logs.map(log => [
      log.id,
      log.createdAt.toISOString(),
      log.userName || "System",
      log.userEmail || "system@local",
      log.action,
      log.resourceType || "N/A",
      log.resourceId || "N/A",
      log.ipAddress || "N/A"
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val}"`).join(","))
    ].join("\n")

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="djalilnet_audit_log_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Failed to export activity logs:", error)
    return Response.json({ error: "Failed to export logs" }, { status: 500 })
  }
}
