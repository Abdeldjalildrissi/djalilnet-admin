import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { emailQueue, emails, emailCampaigns, emailRecipients, subscribers } from "@/db/schema"
import { eq, sql, and, lte, or, inArray } from "drizzle-orm"
import { resend, FROM_EMAIL } from "@/lib/resend"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }
  
  try {
    const now = new Date()

    // 1. Activate scheduled campaigns that should start now
    await db.update(emailCampaigns)
      .set({ status: "processing" })
      .where(and(
        eq(emailCampaigns.status, "scheduled"),
        lte(emailCampaigns.scheduledAt, now)
      ))

    // 2. Process recipients from "processing" campaigns
    const batchSize = 25 // Limit batch size for serverless
    
    // Check for unsubscribed emails to filter them
    const activeSubscribers = await db.select({ email: subscribers.email }).from(subscribers).where(eq(subscribers.active, true))
    const activeEmails = activeSubscribers.map(s => s.email)

    // Mark a batch as "processing" to handle parallel runs safely
    const recipientsToProcess = await db.select({ id: emailRecipients.id }).from(emailRecipients).where(and(
      eq(emailRecipients.status, "pending"),
      sql`${emailRecipients.campaignId} IN (SELECT id FROM ${emailCampaigns} WHERE status IN ('processing', 'pending'))`
    )).limit(batchSize)

    if (recipientsToProcess.length > 0) {
      const ids = recipientsToProcess.map(r => r.id)
      await db.update(emailRecipients).set({ status: "processing" }).where(inArray(emailRecipients.id, ids))
    }

    const pendingRecipients = await db.query.emailRecipients.findMany({
      where: inArray(emailRecipients.id, recipientsToProcess.map(r => r.id)),
      with: {
        campaign: {
          with: {
            sender: true
          }
        }
      }
    })

    const campaignResults = []
    const appUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.djalilnet.com"
    
    for (const recipient of pendingRecipients) {
      const campaign = recipient.campaign
      const senderEmail = campaign.sender?.email || FROM_EMAIL
      const senderName = campaign.sender?.name || "Djalilnet Admin"
      
      // Suppression list check (if they are in subscribers table and NOT active)
      const isSubscribed = await db.select().from(subscribers).where(and(
        eq(subscribers.email, recipient.email),
        eq(subscribers.active, false)
      )).limit(1)

      if (isSubscribed.length > 0) {
        await db.update(emailRecipients).set({ status: "failed", error: "User is unsubscribed" }).where(eq(emailRecipients.id, recipient.id))
        campaignResults.push({ id: recipient.id, success: false, error: "Unsubscribed" })
        continue
      }

      // Personalization logic
      let personalizedBody = campaign.bodyHtml
      personalizedBody = personalizedBody.replace(/\{\{name\}\}/g, recipient.firstName || (recipient.email.split('@')[0]))
      personalizedBody = personalizedBody.replace(/\{\{firstName\}\}/g, recipient.firstName || "")
      personalizedBody = personalizedBody.replace(/\{\{lastName\}\}/g, recipient.lastName || "")
      personalizedBody = personalizedBody.replace(/\{\{email\}\}/g, recipient.email)
      
      // Unsubscribe link
      const unsubscribeUrl = `${appUrl}/api/emails/unsubscribe?email=${encodeURIComponent(recipient.email)}`
      personalizedBody = personalizedBody.replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl)
      
      // Tracking pixel injection
      const trackingPixel = `<div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;"><img src="${appUrl}/api/emails/track/open/${recipient.id}" width="1" height="1" style="display:none" alt="" /></div>`
      personalizedBody += trackingPixel
      
      // Append unsubscribe footer if not present
      if (!personalizedBody.includes("unsubscribe")) {
        personalizedBody += `<div style="padding: 20px; border-top: 1px solid #eee; margin-top: 40px; font-size: 12px; color: #999; text-align: center;">
          This email was sent to ${recipient.email}. <br/>
          <a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">Unsubscribe from our list</a>
        </div>`
      }

      try {
        const { data, error } = await resend.emails.send({
          from: `${senderName} <${senderEmail}>`,
          to: [recipient.email],
          subject: campaign.subject,
          html: personalizedBody,
        })

        if (error) throw new Error(error.message)

        // Update recipient as sent
        await db.update(emailRecipients)
          .set({ 
            status: "completed", 
            processedAt: new Date(),
            attempts: recipient.attempts + 1
          })
          .where(eq(emailRecipients.id, recipient.id))

        // Increment campaign sent count
        await db.update(emailCampaigns)
          .set({ sentRecipients: sql`${emailCampaigns.sentRecipients} + 1` })
          .where(eq(emailCampaigns.id, campaign.id))

        campaignResults.push({ id: recipient.id, success: true })
      } catch (err: any) {
        console.error(`[QueueProcessor] Recipient ${recipient.id} failed:`, err)
        
        const isLastAttempt = recipient.attempts + 1 >= recipient.maxAttempts
        
        await db.update(emailRecipients)
          .set({
            status: isLastAttempt ? "failed" : "pending",
            error: err.message,
            attempts: recipient.attempts + 1,
            lastAttemptAt: new Date(),
          })
          .where(eq(emailRecipients.id, recipient.id))
        
        if (isLastAttempt) {
          await db.update(emailCampaigns)
            .set({ failedRecipients: sql`${emailCampaigns.failedRecipients} + 1` })
            .where(eq(emailCampaigns.id, campaign.id))
        }

        campaignResults.push({ id: recipient.id, success: false, error: err.message })
      }
    }

    // 3. Mark completed campaigns
    // A campaign is completed if it was processing and has no more pending recipients
    const processingCampaigns = await db.select().from(emailCampaigns).where(eq(emailCampaigns.status, "processing"))
    for (const camp of processingCampaigns) {
      const [remaining] = await db.select({ count: sql`count(*)` }).from(emailRecipients).where(and(
        eq(emailRecipients.campaignId, camp.id),
        eq(emailRecipients.status, "pending")
      ))
      
      if (Number((remaining as any).count) === 0) {
        await db.update(emailCampaigns)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(emailCampaigns.id, camp.id))
      }
    }

    // 4. Original queue processing (backward compatibility)
    const pending = await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.status, "pending"))
      .limit(10)

    const legacyResults = []
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
        
        await db.update(emails)
          .set({ status: "sent", resendId: data!.id, sentAt: new Date() })
          .where(sql`to_address = ${job.toAddress} AND subject = ${job.subject} AND status = 'draft'`)

        legacyResults.push({ id: job.id, success: true })
      } catch (err: any) {
        console.error(`[QueueProcessor] Legacy Job ${job.id} failed:`, err)
        await db.update(emailQueue)
          .set({ status: "failed", error: err.message, attempts: (job.attempts ?? 0) + 1 })
          .where(eq(emailQueue.id, job.id))
        legacyResults.push({ id: job.id, success: false, error: err.message })
      }
    }

    return NextResponse.json({ 
      campaigns: { processed: pendingRecipients.length, results: campaignResults },
      legacy: { processed: pending.length, results: legacyResults } 
    })
  } catch (err) {
    console.error("[QueueProcessor] Critical failure:", err)
    return NextResponse.json({ error: "Processor failed" }, { status: 500 })
  }
}
