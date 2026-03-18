import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { authRateLimit } from "@/lib/ratelimit"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // CRITICAL SECURITY FIX: Prevent brute-force password guessing
  if (pathname.startsWith("/api/auth/sign-in")) {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
    try {
      const { success } = await authRateLimit.limit(`auth-${ip}`)
      if (!success) {
        return NextResponse.json({ error: "Too many login attempts" }, { status: 429 })
      }
    } catch (e) {
      console.warn("[Middleware] Rate limit check failed", e)
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
