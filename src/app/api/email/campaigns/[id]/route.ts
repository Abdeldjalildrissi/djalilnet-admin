import { NextRequest } from "next/server"
import { db } from "@/db"
import { emailCampaigns, emailRecipients } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const campaign = await db.query.emailCampaigns.findFirst({
    where: eq(emailCampaigns.id, id),
    with: {
      template: true,
      sender: true,
      recipients: {
        orderBy: [desc(emailRecipients.createdAt)],
      },
    },
  })

  if (!campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 })
  }

  return Response.json({ data: campaign })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    // Supported actions: cancel, retry_failed
    if (body.action === "cancel") {
      await db.update(emailCampaigns).set({ status: "cancelled" }).where(eq(emailCampaigns.id, id))
    } else if (body.action === "retry_failed") {
      await db.update(emailRecipients).set({ status: "pending", error: null }).where(eq(emailRecipients.campaignId, id))
      await db.update(emailCampaigns).set({ status: "processing" }).where(eq(emailCampaigns.id, id))
    }

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id))
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
