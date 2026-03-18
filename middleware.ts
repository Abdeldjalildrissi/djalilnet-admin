import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Create rate limiters
const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"), // 5 attempts per 10 seconds
  analytics: true,
  prefix: "ratelimit:login",
})

const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
  analytics: true,
  prefix: "ratelimit:api",
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"

  // Rate Limiting Logic
  if (pathname.startsWith("/login") && request.method === "POST") {
    const { success } = await loginRateLimit.limit(ip)
    if (!success) {
      return new NextResponse("Too Many Requests", { status: 429 })
    }
  }

  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    const { success } = await apiRateLimit.limit(ip)
    if (!success) {
      return new NextResponse("Too Many Requests", { status: 429 })
    }
  }

  const isAuthRoute = pathname === "/login" || pathname.startsWith("/login")
  const isApiAuth = pathname.startsWith("/api/auth")
  const isApiWebhook = pathname.startsWith("/api/webhooks")
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")

  const isApiUpload = pathname.startsWith("/api/uploadthing")

  if (isPublicAsset || isApiAuth || isApiWebhook || isApiUpload) {
    return NextResponse.next()
  }

  const sessionCookie = getSessionCookie(request)

  // Protected route without session → redirect to login
  if (!isAuthRoute && !sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Already logged in → redirect away from login
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
