import { NextRequest } from "next/server"
import { db } from "@/db"
import { articles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"
import { updateArticleSchema } from "@/lib/validations/articles"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const article = await db.query.articles.findFirst({
    where: eq(articles.id, id),
    with: { author: true, category: true },
  })

  if (!article) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json({ data: article })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await db.query.articles.findFirst({
    where: eq(articles.id, id),
  })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  // Authors can only edit their own
  if (
    (session.user as { role?: string }).role === "author" &&
    existing.authorId !== session.user.id
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = updateArticleSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const wasPublished = existing.status === "published"
  const nowPublishing = parsed.data.status === "published"

  const [updated] = await db
    .update(articles)
    .set({
      ...parsed.data,
      content: parsed.data.content as Record<string, unknown> | undefined,
      categoryId: parsed.data.categoryId ?? existing.categoryId,
      coverImage: parsed.data.coverImage || existing.coverImage,
      publishedAt:
        !wasPublished && nowPublishing ? new Date() : existing.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning()

  logActivity({
    userId: session.user.id,
    action: "article.update",
    resourceId: updated.id,
    resourceType: "article",
    metadata: { title: updated.title, status: updated.status },
  })

  return Response.json({ data: updated })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as { role?: string }).role
  if (!["super_admin", "editor"].includes(role ?? "")) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  await db.delete(articles).where(eq(articles.id, id))

  logActivity({
    userId: session.user.id,
    action: "article.delete",
    resourceId: id,
    resourceType: "article",
  })

  return Response.json({ success: true })
}
