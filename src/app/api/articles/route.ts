import { NextRequest } from "next/server"
export const dynamic = "force-dynamic"
import { db } from "@/db"
import { articles, categories, users } from "@/db/schema"
import { eq, desc, like, and, sql, ilike } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"
import {
  articleQuerySchema,
  createArticleSchema,
} from "@/lib/validations/articles"
import { slugify, sanitize, computeReadingTime } from "@/lib/utils"

export async function GET(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const query = articleQuerySchema.parse({
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "20",
    status: searchParams.get("status") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  })

  const offset = (query.page - 1) * query.limit

  const conditions = [
    query.status ? eq(articles.status, query.status) : undefined,
    query.category ? eq(articles.categoryId, query.category) : undefined,
    query.search ? ilike(articles.title, `%${query.search}%`) : undefined,
  ].filter(Boolean) as ReturnType<typeof eq>[]

  const [data, [totalRow]] = await Promise.all([
    db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        status: articles.status,
        excerpt: articles.excerpt,
        coverImage: articles.coverImage,
        tags: articles.tags,
        readingTime: articles.readingTime,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        publishedAt: articles.publishedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(articles.updatedAt))
      .limit(query.limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(articles)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ])

  return Response.json({
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: totalRow.count,
      totalPages: Math.ceil(totalRow.count / query.limit),
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = createArticleSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const slug = parsed.data.slug || slugify(parsed.data.title)

  const rawHtml = parsed.data.contentHtml ? sanitize(parsed.data.contentHtml) : ""
  // Strip the first H1 tag if it exists (usually the title duplicated from markdown)
  const sanitizedHtml = rawHtml.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "").trim()
  const readingTime = computeReadingTime(sanitizedHtml)

  const [article] = await db
    .insert(articles)
    .values({
      title: parsed.data.title,
      slug,
      content: parsed.data.content as Record<string, unknown>,
      contentHtml: sanitizedHtml,
      excerpt: parsed.data.excerpt,
      status: parsed.data.status,
      categoryId: parsed.data.categoryId,
      authorId: session.user.id,
      coverImage: parsed.data.coverImage || null,
      tags: parsed.data.tags,
      readingTime,
      publishedAt:
        parsed.data.status === "published" ? new Date() : undefined,
    })
    .returning()

  logActivity({
    userId: session.user.id,
    action: "article.create",
    resourceId: article.id,
    resourceType: "article",
    metadata: { title: article.title, status: article.status },
  })

  return Response.json({ data: article }, { status: 201 })
}
