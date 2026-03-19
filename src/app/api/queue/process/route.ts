import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { emailQueue, emails } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { resend, FROM_EMAIL } from "@/lib/resend"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // Simple protection with a CRON_SECRET if desired, but here we prioritize restoration
  try {
    // Process one batch of pending queue items
    const pending = await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.status, "pending"))
      .limit(10)

    const results = []

    for (const job of pending) {
      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: [job.toAddress],
          subject: job.subject,
          html: job.bodyHtml ?? "",
        })

        if (error) throw new Error(error.message)

        await db
          .update(emailQueue)
          .set({ status: "completed", processedAt: new Date() })
          .where(eq(emailQueue.id, job.id))
        
        // Also update the main emails table if a bullJobId was linked or matching subject/to
        await db.update(emails)
          .set({ status: "sent", resendId: data!.id, sentAt: new Date() })
          .where(sql`to_address = ${job.toAddress} AND subject = ${job.subject} AND status = 'draft'`)

        results.push({ id: job.id, success: true })
      } catch (err: any) {
        console.error(`[QueueProcessor] Job ${job.id} failed:`, err)
        
        await db
          .update(emailQueue)
          .set({
            status: "failed",
            error: err.message,
            attempts: (job.attempts ?? 0) + 1,
          })
          .where(eq(emailQueue.id, job.id))
        
        results.push({ id: job.id, success: false, error: err.message })
      }
    }

    return NextResponse.json({ processed: pending.length, results })
  } catch (err) {
    console.error("[QueueProcessor] Critical failure:", err)
    return NextResponse.json({ error: "Processor failed" }, { status: 500 })
  }
}
