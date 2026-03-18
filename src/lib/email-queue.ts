import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"
import { db } from "@/db"
import { emails, emailQueue } from "@/db/schema"
import { eq } from "drizzle-orm"
import { resend, FROM_EMAIL } from "./resend"

// Ensure valid connection logic with Upstash Redis (Standard Redis Protocol)
const redisUrl = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL;
if (!redisUrl) {
  console.warn("[EmailQueue] UPSTASH_REDIS_URL is not defined. Queue will not function.");
}

const connection = new IORedis(redisUrl!, {
  maxRetriesPerRequest: null,
})

export const queue = new Queue("emails", {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})

// Run the worker inside the application context
export const emailWorker = new Worker("emails", async (job) => {
  const { to, cc, subject, html, emailId, attachments } = job.data
  
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    cc,
    subject,
    html,
    attachments,
  })
  
  if (error) {
    throw new Error(error.message)
  }

  // Update DB record on success
  await db.update(emails)
    .set({ 
      status: "sent", 
      resendId: data!.id, 
      sentAt: new Date() 
    })
    .where(eq(emails.id, emailId))

}, { connection: connection as any, concurrency: 5 })

emailWorker.on("failed", async (job, err) => {
  if (!job) return
  
  await db.update(emails)
    .set({ 
      status: "failed", 
      failureReason: err.message, 
      retryCount: job.attemptsMade 
    })
    .where(eq(emails.id, job.data.emailId))
})
