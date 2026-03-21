import { NextRequest } from "next/server"
import { db } from "@/db"
import { emails } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // In Next.js 15, params is a Promise
) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const emailData = await db.query.emails.findFirst({
    where: eq(emails.id, id),
  })

  if (!emailData) {
    return Response.json({ error: "Email not found" }, { status: 404 })
  }

  return Response.json({ data: emailData })
}
