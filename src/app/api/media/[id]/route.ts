import { NextRequest } from "next/server"
export const dynamic = "force-dynamic"
import { db } from "@/db"
import { media } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/activity-logger"
import { utapi } from "@/lib/uploadthing-server"
import { z } from "zod"

const updateMediaSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  albumId: z.string().uuid().nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = updateMediaSchema.safeParse(body)
    
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const { id } = await params;

    const [updatedMedia] = await db
      .update(media)
      .set({
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.albumId !== undefined && { albumId: parsed.data.albumId }),
      })
      .where(eq(media.id, id))
      .returning()

    if (!updatedMedia) {
      return Response.json({ error: "Media not found" }, { status: 404 })
    }

    logActivity({
      userId: session.user.id,
      action: "media.update",
      resourceId: updatedMedia.id,
      resourceType: "media",
      metadata: { name: updatedMedia.name, albumId: updatedMedia.albumId },
    })

    return Response.json(updatedMedia)
  } catch (error) {
    console.error("Failed to update media:", error)
    return Response.json({ error: "Failed to update media" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params;

    // 1. Get media info to delete from UploadThing
    const [item] = await db
      .select()
      .from(media)
      .where(eq(media.id, id))

    if (!item) {
      return Response.json({ error: "Media not found" }, { status: 404 })
    }

    // 2. Delete from UploadThing
    if (item.key) {
      await utapi.deleteFiles(item.key)
    }

    // 3. Delete from DB
    await db.delete(media).where(eq(media.id, id))

    logActivity({
      userId: session.user.id,
      action: "media.delete",
      resourceId: id,
      resourceType: "media",
      metadata: { name: item.name, key: item.key },
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete media:", error)
    return Response.json({ error: "Failed to delete media" }, { status: 500 })
  }
}
