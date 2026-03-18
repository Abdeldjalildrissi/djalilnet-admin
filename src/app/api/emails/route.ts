import { NextRequest } from "next/server"
import { db } from "@/db"
import { emails } from "@/db/schema"
import { desc, eq, ilike, or, and } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"
import { emailQuerySchema } from "@/lib/validations/email"

export async function GET(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const query = emailQuerySchema.parse({
    direction: searchParams.get("direction") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    filter: searchParams.get("filter") ?? "all",
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "30",
  })

  const offset = (query.page - 1) * query.limit

  const conditions = [
    query.direction ? eq(emails.direction, query.direction) : undefined,
    query.filter === "unread" ? eq(emails.isRead, false) : undefined,
    query.filter === "read" ? eq(emails.isRead, true) : undefined,
    query.filter === "starred" ? eq(emails.isStarred, true) : undefined,
    query.search
      ? or(
          ilike(emails.fromAddress, `%${query.search}%`),
          ilike(emails.subject, `%${query.search}%`)
        )
      : undefined,
  ].filter(Boolean) as ReturnType<typeof eq>[]

  const data = await db
    .select()
    .from(emails)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(emails.createdAt))
    .limit(query.limit)
    .offset(offset)

  return Response.json({ data })
}
