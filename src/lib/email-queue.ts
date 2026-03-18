import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"
import { db } from "@/db"
import { emails, emailQueue } from "@/db/schema"
import { eq } from "drizzle-orm"
import { resend, FROM_EMAIL } from "./resend"

// Ensure valid connection logic with Upstash Redis
const connection = new IORedis(process.env.UPSTASH_REDIS_REST_URL!, {
  tls: { rejectUnauthorized: false },
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
  const { to, cc, subject, html, emailId } = job.data
  
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    cc,
    subject,
    html,
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
