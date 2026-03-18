import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// We check if the environment variables exist so the edge runtime doesn't crash on unconfigured deployments
const redisAvailable = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

// Fallback dummy limiter if Upstash is not configured
const dummyLimiter = {
  limit: async (_identifier: string) => ({ success: true, limit: 10, remaining: 9, reset: 0 })
}

export const authRateLimit = redisAvailable
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      // Strict sliding window for authentication requests: 5 requests per minute per IP
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
    })
  : dummyLimiter as any
