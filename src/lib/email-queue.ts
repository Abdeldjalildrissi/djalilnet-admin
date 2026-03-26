/* eslint-disable @typescript-eslint/no-explicit-any */
import { Queue } from "bullmq"
import IORedis from "ioredis"

// Use TCP connection for BullMQ (Upstash Redis)
let _queue: Queue | null = null

export function getQueue() {
  if (!_queue) {
    const connection = new IORedis({
      host: process.env.UPSTASH_REDIS_HOST || "localhost",
      port: 6379,
      password: process.env.UPSTASH_REDIS_TOKEN || "",
      tls: process.env.UPSTASH_REDIS_HOST ? {} : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })

    _queue = new Queue("emails", {
      connection: connection as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    })
  }
  return _queue
}

// For backward compatibility
export const queue = {
  addBulk: (jobs: any[]) => getQueue().addBulk(jobs),
  add: (name: string, data: any, opts?: any) => getQueue().add(name, data, opts),
}

// Note: BullMQ Workers do NOT run on Vercel Serverless.
// We use a Vercel Cron at /api/queue/process to poll and send emails.

