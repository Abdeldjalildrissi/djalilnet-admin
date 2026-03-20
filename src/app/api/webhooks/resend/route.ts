import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import { db } from "@/db"
import { emails } from "@/db/schema"
import { eq } from "drizzle-orm"
import { sanitize } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RESEND_WEBHOOK_SECRET
    if (!secret) {
      console.error("[WEBHOOK] RESEND_WEBHOOK_SECRET not set")
      return NextResponse.json({ error: "Misconfigured" }, { status: 500 })
    }

    const body = await req.text()
    const headers = {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    }

    let payload: any
    try {
      const wh = new Webhook(secret)
      payload = wh.verify(body, headers)
    } catch (err) {
      console.error("[WEBHOOK] Signature verification failed", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const { type, data } = payload

    // Handle inbound email
    if (type === "email.received") {
      await db.insert(emails).values({
        direction: "inbound",
        fromAddress: data.from,
        toAddress: Array.isArray(data.to) ? data.to[0] : data.to,
        subject: data.subject ?? "(no subject)",
        bodyText: data.text ?? "",
        bodyHtml: data.html ? sanitize(data.html) : "",
        status: "received",
        resendId: data.email_id,
        receivedAt: new Date(data.created_at),
      })
    }

    // Handle delivery tracking
    if (type === "email.delivered" && data.email_id) {
      await db.update(emails)
        .set({ status: "sent" })
        .where(eq(emails.resendId, data.email_id))
    }

    if (type === "email.bounced" && data.email_id) {
      await db.update(emails)
        .set({ status: "bounced", failureReason: data.reason ?? "bounced" })
        .where(eq(emails.resendId, data.email_id))
    }

    if (type === "email.opened" && data.email_id) {
      await db.update(emails)
        .set({ openedAt: new Date() })
        .where(eq(emails.resendId, data.email_id))
    }

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (err) {
    console.error("[WEBHOOK_CRASH]", err)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}
