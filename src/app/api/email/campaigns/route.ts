import { NextRequest } from "next/server"
import { db } from "@/db"
import { emailCampaigns, emailRecipients } from "@/db/schema"
import { requireAuth } from "@/lib/auth-helpers"
import { campaignCreationLimit } from "@/lib/ratelimit"
import * as z from "zod"

const campaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  templateId: z.string().uuid().optional(),
  senderId: z.string().uuid(),
  bodyHtml: z.string().min(1, "Body is required"),
  scheduledAt: z.string().optional(), // Expected as date string
  recipients: z.array(z.string().email("Invalid email address")).min(1, "At least one recipient is required"),
})

export async function POST(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Rate limit — inside try/catch so Redis failures are handled gracefully
    const { success } = await campaignCreationLimit.limit(session.user.id)
    if (!success) {
      return Response.json({ error: "Too many campaigns created. Please wait an hour." }, { status: 429 })
    }

    const json = await request.json()
    const body = campaignSchema.parse(json)

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create the campaign
      const [newCampaign] = await tx
        .insert(emailCampaigns)
        .values({
          name: body.name,
          subject: body.subject,
          templateId: body.templateId,
          senderId: body.senderId,
          bodyHtml: body.bodyHtml,
          scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
          status: body.scheduledAt ? "scheduled" : "pending",
          totalRecipients: body.recipients.length,
          createdById: session.user.id,
        })
        .returning()

      // 2. Add recipients
      const recipientData = body.recipients.map((email) => ({
        campaignId: newCampaign.id,
        email,
        status: "pending" as any,
      }))

      // Batch insert recipients for efficiency
      // Drizzle handles multiple values in insert
      if (recipientData.length > 0) {
        await tx.insert(emailRecipients).values(recipientData)
      }

      return newCampaign
    })

    return Response.json({ data: result })
  } catch (error) {
    console.error("Campaign Creation Error:", error instanceof Error ? error.message : error)
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const campaigns = await db.query.emailCampaigns.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    with: {
      template: true,
      sender: true,
    },
  })

  return Response.json({ data: campaigns })
}
