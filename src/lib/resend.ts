import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY)

if (!process.env.RESEND_FROM_EMAIL) {
  console.warn("RESEND_FROM_EMAIL is not set. Defaulting to onboarding@resend.dev. This will ONLY work for sending to the owner's email address.")
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "contact@djalilnet.com"
