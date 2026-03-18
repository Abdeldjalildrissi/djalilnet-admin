import { auth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function requireAuth(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })
  return session
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
) {
  const session = await requireAuth(request)
  if (!session) return null
  if (!allowedRoles.includes(session.user.role as string)) return null
  return session
}
