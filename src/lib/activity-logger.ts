import { db } from "@/db"
import { activityLogs } from "@/db/schema"

interface LogActivityParams {
  userId: string
  action: string
  resourceId?: string
  resourceType?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}

export function logActivity(params: LogActivityParams): void {
  // Fire-and-forget — never await to avoid blocking critical path
  db.insert(activityLogs)
    .values({
      userId: params.userId,
      action: params.action,
      resourceId: params.resourceId,
      resourceType: params.resourceType,
      metadata: params.metadata ?? {},
      ipAddress: params.ipAddress,
      createdAt: new Date(),
    })
    .execute()
    .catch(console.error)
}
