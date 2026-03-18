import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Abdeldjalil Drissi <contact@djalilnet.com>"
export const ADMIN_EMAIL = "abdeldjalildrissi@gmail.com"
