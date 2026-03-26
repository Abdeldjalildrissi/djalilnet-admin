import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { authRateLimit, globalRateLimit } from "@/lib/ratelimit"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- Rate Limiting Strategy ---
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';
  
  // Only rate-limit actual sign-in POST attempts — NOT page loads or session checks.
  // Applying the limiter to GET /login or GET /api/auth/* drains the bucket on every
  // navigation and triggers 429 before a single credential is submitted.
  const isSignInAttempt =
    request.method === "POST" &&
    (pathname.startsWith("/api/auth/sign-in") || pathname.startsWith("/api/auth/email-password"));

  if (isSignInAttempt) {
    try {
      const { success } = await authRateLimit.limit(ip);
      if (!success) return NextResponse.json({ error: "Too many login attempts. Please wait 15 minutes." }, { status: 429 });
    } catch (e) { console.error("Auth ratelimit error:", e) }
  } else if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    try {
      const { success } = await globalRateLimit.limit(ip);
      if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    } catch (e) { console.error("Global ratelimit error:", e) }
  }

  // --- Auth Flow ---
  const isAuthRoute = pathname === "/login" || pathname.startsWith("/login")
  const isApiAuth = pathname.startsWith("/api/auth")
  const isApiWebhook = pathname.startsWith("/api/webhooks")
  const isPublicAsset = pathname.startsWith("/_next") || pathname.startsWith("/favicon")
  const isApiUpload = pathname.startsWith("/api/uploadthing")

  let response: NextResponse | undefined;

  if (isPublicAsset || isApiAuth || isApiWebhook || isApiUpload) {
    response = NextResponse.next()
  } else {
    const sessionCookie = getSessionCookie(request)

    // Protected route without session → redirect to login
    if (!isAuthRoute && !sessionCookie) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      response = NextResponse.redirect(loginUrl)
    } 
    // Already logged in → redirect away from login
    else if (isAuthRoute && sessionCookie) {
      response = NextResponse.redirect(new URL("/", request.url))
    } else {
      response = NextResponse.next()
    }
  }

  // Fallback (for typescript bounds)
  if (!response) response = NextResponse.next();

  // --- Security Headers ---
  const isProd = process.env.NODE_ENV === "production";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com data:;
    img-src 'self' data: blob: https://utfs.io https://*.utfs.io https://images.unsplash.com https://res.cloudinary.com https://avatars.githubusercontent.com https://uploadthing.com;
    connect-src 'self' https://uploadthing.com https://*.uploadthing.com https://utfs.io https://*.utfs.io https://*.ingest.sentry.io;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-src 'none';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, " ").trim();

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  // Remove server fingerprinting header
  response.headers.delete("X-Powered-By");

  if (isProd) {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
