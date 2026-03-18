import { NextRequest } from "next/server"
export const dynamic = "force-dynamic"
import { db } from "@/db"
import { mediaAlbums, media } from "@/db/schema"
import { eq, sql, desc } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"
import { z } from "zod"

const createAlbumSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export async function GET(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const albums = await db
      .select({
        id: mediaAlbums.id,
        name: mediaAlbums.name,
        description: mediaAlbums.description,
        createdAt: mediaAlbums.createdAt,
        mediaCount: sql<number>`count(${media.id})::int`,
      })
      .from(mediaAlbums)
      .leftJoin(media, eq(media.albumId, mediaAlbums.id))
      .groupBy(mediaAlbums.id)
      .orderBy(desc(mediaAlbums.createdAt))

    return Response.json(albums)
  } catch (error) {
    console.error("Failed to fetch albums:", error)
    return Response.json({ error: "Failed to fetch albums" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = createAlbumSchema.safeParse(body)
    
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const [album] = await db
      .insert(mediaAlbums)
      .values({
        name: parsed.data.name,
        description: parsed.data.description,
      })
      .returning()

    logActivity({
      userId: session.user.id,
      action: "media.album.create",
      resourceId: album.id,
      resourceType: "media_album",
      metadata: { name: album.name },
    })

    return Response.json(album, { status: 201 })
  } catch (error) {
    console.error("Failed to create album:", error)
    return Response.json({ error: "Failed to create album" }, { status: 500 })
  }
}
