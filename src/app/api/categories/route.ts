import { NextRequest } from "next/server"
import { db } from "@/db"
import { categories } from "@/db/schema"
import { requireAuth } from "@/lib/auth-helpers"
import { slugify } from "@/lib/utils"
import { z } from "zod"

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export async function GET(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const all = await db.select().from(categories).orderBy(categories.name)
  return Response.json({ data: all })
}

export async function POST(request: NextRequest) {
  const session = await requireAuth(request)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as { role?: string }).role
  if (!["super_admin", "editor"].includes(role ?? "")) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createCategorySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const [category] = await db
    .insert(categories)
    .values({
      name: parsed.data.name,
      slug: parsed.data.slug ?? slugify(parsed.data.name),
      description: parsed.data.description,
      color: parsed.data.color ?? "#3B82F6",
    })
    .returning()

  return Response.json({ data: category }, { status: 201 })
}
