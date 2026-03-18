import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

let cachedLimiter: Ratelimit | null = null;

export async function checkAuthRateLimit(ip: string): Promise<boolean> {
  try {
    const redisAvailable = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN
    if (!redisAvailable) return true

    if (!cachedLimiter) {
      cachedLimiter = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        ephemeralCache: new Map()
      })
    }

    const { success } = await cachedLimiter.limit(`auth-${ip}`)
    return success
  } catch (error) {
    console.warn("Ratelimiter exception ignored (failing open):", error)
    return true
  }
}
