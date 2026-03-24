import { NextRequest } from "next/server"
import { db } from "@/db"
import { subscribers } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")

  if (!email) {
    return new Response("Email is required", { status: 400 })
  }

  try {
    // Mark as inactive in subscribers table
    await db
      .update(subscribers)
      .set({ active: false })
      .where(eq(subscribers.email, email))

    // Return a nice HTML confirmation
    return new Response(
      `
      <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; }
            .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px; }
            h1 { color: #0f172a; margin-top: 0; }
            p { color: #64748b; line-height: 1.5; }
            .btn { display: inline-block; margin-top: 1.5rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 0.5rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>You've been unsubscribed</h1>
            <p>We've removed <strong>${email}</strong> from our mailing list. You will no longer receive marketing emails from us.</p>
            <p>If this was a mistake, please contact our support team.</p>
          </div>
        </body>
      </html>
      `,
      { headers: { "Content-Type": "text/html" } }
    )
  } catch (error) {
    return new Response("An error occurred", { status: 500 })
  }
}
