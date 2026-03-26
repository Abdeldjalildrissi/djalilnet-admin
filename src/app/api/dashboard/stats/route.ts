/* eslint-disable @typescript-eslint/no-unused-vars */
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
      .select({ 
        status: emails.status,
        count: sql<number>`count(*)::int` 
      })
      .from(emails)
      .groupBy(emails.status),

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

  // 7-day activity breakdown (Optimized)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const [articlesByDay, emailsByDay] = await Promise.all([
    db
      .select({
        date: sql<string>`DATE_TRUNC('day', ${articles.createdAt})`,
        count: sql<number>`count(*)::int`,
      })
      .from(articles)
      .where(gte(articles.createdAt, sevenDaysAgo))
      .groupBy(sql`DATE_TRUNC('day', ${articles.createdAt})`),
    db
      .select({
        date: sql<string>`DATE_TRUNC('day', ${emails.createdAt})`,
        count: sql<number>`count(*)::int`,
      })
      .from(emails)
      .where(gte(emails.createdAt, sevenDaysAgo))
      .groupBy(sql`DATE_TRUNC('day', ${emails.createdAt})`),
  ])

  const activityData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    date.setHours(0, 0, 0, 0)
    
    // Find count for this specific day (handle potential timezone/format differences)
    const articleCount = articlesByDay.find(d => 
      new Date(d.date).toDateString() === date.toDateString()
    )?.count ?? 0
    
    const emailCount = emailsByDay.find(d => 
      new Date(d.date).toDateString() === date.toDateString()
    )?.count ?? 0

    return {
      name: date.toLocaleDateString("en-US", { weekday: "short" }),
      articles: articleCount,
      emails: emailCount,
    }
  })

  const totalReceived = emailStats.find(s => s.status === "received")?.count ?? 0
  const totalSent = emailStats.find(s => s.status === "sent")?.count ?? 0
  const totalFailed = emailStats.find(s => s.status === "failed")?.count ?? 0

  return Response.json({
    articles: {
      total: totalArticles,
      published: publishedArticles,
      draft: draftArticles,
    },
    emails: { 
      total: totalReceived,
      sent: totalSent,
      failed: totalFailed
    },
    users: { total: userStats[0]?.count ?? 0 },
    recentActivity,
    activityData,
    since: thirtyDaysAgo,
  })
}
