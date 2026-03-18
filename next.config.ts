import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async headers() {
    const isProd = process.env.NODE_ENV === "production"
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob: utfs.io",
              "connect-src 'self' https://*.ingest.sentry.io https://uploadthing.com https://*.uploadthing.com https://utfs.io https://*.utfs.io",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: isProd ? "max-age=31536000; includeSubDomains; preload" : "",
          },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ].filter(h => h.value !== ""),
      },
    ]
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "**.neon.tech" },
    ],
  },
}

export default nextConfig
