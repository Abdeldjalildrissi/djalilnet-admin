import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthRoute = pathname === "/login" || pathname.startsWith("/login")
  const isApiAuth = pathname.startsWith("/api/auth")
  const isApiWebhook = pathname.startsWith("/api/webhooks")
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")

  if (isPublicAsset || isApiAuth || isApiWebhook) {
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
