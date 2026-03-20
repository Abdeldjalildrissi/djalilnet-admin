import { z } from "zod"

export const articleQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(["draft", "published", "archived"]).optional(),
  category: z.string().uuid().optional(),
  search: z.string().optional(),
})

export const createArticleSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title is too long"),
  slug: z.string()
    .min(3)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens")
    .optional()
    .or(z.literal("")),
  content: z.record(z.string(), z.unknown()).optional(),
  contentHtml: z.string().min(1, "Content is required").optional().or(z.literal("")),
  excerpt: z.string().max(500, "Excerpt is too long").optional().nullable().or(z.literal("")),
  coverImage: z.string().nullable().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  categoryId: z.string().uuid("Invalid category ID").optional().nullable().or(z.literal("")),
  tags: z.array(z.string().max(50)).max(20, "Too many tags").default([]),
})

export const updateArticleSchema = createArticleSchema.partial()

export type ArticleQuery = z.infer<typeof articleQuerySchema>
export type CreateArticle = z.infer<typeof createArticleSchema>
export type UpdateArticle = z.infer<typeof updateArticleSchema>
