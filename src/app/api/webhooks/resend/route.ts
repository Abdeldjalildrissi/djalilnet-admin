import { NextRequest } from "next/server"
import { db } from "@/db"
import { emails } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  const body = await request.text()

  // Verify Svix signature
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (webhookSecret) {
    try {
      const { Webhook } = await import("svix")
      const wh = new Webhook(webhookSecret)
      const headers = {
        "svix-id": request.headers.get("svix-id") ?? "",
        "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
        "svix-signature": request.headers.get("svix-signature") ?? "",
      }
      wh.verify(body, headers)
    } catch {
      return Response.json({ error: "Invalid signature" }, { status: 400 })
    }
  }

  const event = JSON.parse(body)

  if (event.type === "email.received") {
    await db.insert(emails).values({
      direction: "inbound",
      fromAddress: event.data.from ?? "unknown@unknown.com",
      toAddress: Array.isArray(event.data.to)
        ? event.data.to.join(", ")
        : event.data.to ?? "",
      subject: event.data.subject ?? "(no subject)",
      bodyHtml: event.data.html,
      bodyText: event.data.text,
      status: "received",
      isRead: false,
      resendId: event.data.email_id,
      receivedAt: new Date(event.data.created_at ?? Date.now()),
    })
  }

  if (event.type === "email.opened") {
    await db.update(emails)
      .set({ openedAt: new Date() })
      .where(eq(emails.resendId, event.data.email_id))
  }

  if (event.type === "email.clicked") {
    await db.update(emails)
      .set({ clickedAt: new Date() })
      .where(eq(emails.resendId, event.data.email_id))
  }

  if (event.type === "email.bounced" || event.type === "email.delivery_delayed") {
    await db.update(emails)
      .set({ 
        status: event.type === "email.bounced" ? "bounced" : "failed",
        failureReason: "Delivery bounced or delayed upstream.",
      })
      .where(eq(emails.resendId, event.data.email_id))
  }

  return Response.json({ received: true })
}
