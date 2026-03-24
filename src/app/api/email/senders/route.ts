import { NextRequest } from "next/server"
import { db } from "@/db"
import { emailSenders } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"
import * as z from "zod"

const senderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  isActive: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const data = await db.select().from(emailSenders).orderBy(desc(emailSenders.createdAt))
  return Response.json({ data })
}

export async function POST(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const json = await request.json()
    const body = senderSchema.parse(json)

    const [newSender] = await db.insert(emailSenders).values(body).returning()
    return Response.json({ data: newSender })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 })
    }
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
