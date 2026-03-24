import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Create a new ratelimiter, that allows 10 requests per 10 seconds
export const campaignCreationLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1h"), // 5 campaigns per hour
  analytics: true,
  prefix: "ratelimit:email:campaign:create",
})

export const unsubscribeLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1m"),
  analytics: true,
  prefix: "ratelimit:email:unsubscribe",
})

export const openTrackingLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1m"),
  analytics: true,
  prefix: "ratelimit:email:open",
})

export const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1m"), // 10 login attempts per minute
  analytics: true,
  prefix: "ratelimit:auth",
})

export const globalRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1m"), // 100 requests per minute globally
  analytics: true,
  prefix: "ratelimit:global",
})
