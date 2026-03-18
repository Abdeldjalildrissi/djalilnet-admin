import { NextRequest } from "next/server"
import { db } from "@/db"
import { articles, emails, users, activityLogs } from "@/db/schema"
import { desc, sql, eq, gte, and, lt } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [articleStats, emailStats, userStats, recentActivity] = await Promise.all([
    db
      .select({
        status: articles.status,
        count: sql<number>`count(*)::int`,
      })
      .from(articles)
      .groupBy(articles.status),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(emails)
      .where(eq(emails.direction, "inbound")),

    db.select({ count: sql<number>`count(*)::int` }).from(users),

    db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(15),
  ])

  const totalArticles = articleStats.reduce((s, r) => s + r.count, 0)
  const publishedArticles =
    articleStats.find((r) => r.status === "published")?.count ?? 0
  const draftArticles =
    articleStats.find((r) => r.status === "draft")?.count ?? 0

  // 7-day activity breakdown
  const activityData = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const [articlesCount, emailsCount] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(articles)
          .where(and(gte(articles.createdAt, date), lt(articles.createdAt, nextDate))),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(emails)
          .where(and(gte(emails.createdAt, date), lt(emails.createdAt, nextDate))),
      ])

      return {
        name: date.toLocaleDateString("en-US", { weekday: "short" }),
        articles: articlesCount[0]?.count ?? 0,
        emails: emailsCount[0]?.count ?? 0,
      }
    })
  )

  return Response.json({
    articles: {
      total: totalArticles,
      published: publishedArticles,
      draft: draftArticles,
    },
    emails: { total: emailStats[0]?.count ?? 0 },
    users: { total: userStats[0]?.count ?? 0 },
    recentActivity,
    activityData,
    since: thirtyDaysAgo,
  })
}
