import { z } from "zod"

export const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  cc: z.array(z.string().email()).optional(),
  subject: z.string().min(1, "Subject is required").max(500),
  bodyHtml: z.string().min(1, "Email body is required"),
  templateId: z.string().uuid().optional(),
  variables: z.record(z.string(), z.string()).optional(),
})

export const emailQuerySchema = z.object({
  direction: z.enum(["inbound", "outbound"]).optional(),
  search: z.string().optional(),
  filter: z.enum(["all", "unread", "read", "starred"]).default("all"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(30),
})

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  bodyHtml: z.string().min(1),
  bodyText: z.string().optional(),
  variables: z.array(z.string()).default([]),
})

export type SendEmail = z.infer<typeof sendEmailSchema>
export type EmailQuery = z.infer<typeof emailQuerySchema>
export type CreateTemplate = z.infer<typeof createTemplateSchema>
