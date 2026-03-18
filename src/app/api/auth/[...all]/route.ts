import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

const handlers = toNextJsHandler(auth)

export const GET = async (req: any) => {
  try {
    return await handlers.GET(req);
  } catch (err) {
    console.error("GET AUTH ERROR", err)
    return new Response(JSON.stringify({ error: err?.toString() }), { status: 500 })
  }
}

export const POST = async (req: any) => {
  try {
    return await handlers.POST(req);
  } catch (err) {
    console.error("POST AUTH ERROR", err)
    return new Response(JSON.stringify({ error: err?.toString() }), { status: 500 })
  }
}
