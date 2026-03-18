import { NextRequest } from "next/server"
export const dynamic = "force-dynamic"
import { db } from "@/db"
import { articles, users, media } from "@/db/schema"
import { sql, isNotNull, desc } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Fetch unique cover images from articles
    const articleImages = await db
      .select({ 
        url: articles.coverImage,
        type: sql<string>`'article_cover'`,
        title: articles.title,
        id: articles.id
      })
      .from(articles)
      .where(isNotNull(articles.coverImage))

    // Fetch user avatars (using the correct field name avatarUrl)
    const userImages = await db
      .select({ 
        url: users.avatarUrl,
        type: sql<string>`'user_avatar'`,
        title: users.name,
        id: users.id
      })
      .from(users)
      .where(isNotNull(users.avatarUrl))

    // Fetch direct uploads from media table
    const uploadedMedia = await db
      .select({
        url: media.url,
        type: media.type,
        title: media.name,
        id: media.id
      })
      .from(media)
      .orderBy(desc(media.createdAt))

    // Combine and format
    const allMedia = [
      ...uploadedMedia,
      ...articleImages.map(img => ({ ...img, url: img.url! })),
      ...userImages.map(img => ({ ...img, url: img.url! }))
    ]

    return Response.json(allMedia)
  } catch (error) {
    console.error("Failed to fetch media:", error)
    return Response.json({ error: "Failed to fetch media" }, { status: 500 })
  }
}
