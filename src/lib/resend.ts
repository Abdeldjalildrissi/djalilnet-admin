import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "DRISSI Abdeldjalil <onboarding@resend.dev>"
export const ADMIN_EMAIL = "abdeldjalildrissi@gmail.com"
