import { z } from "zod"

export const articleQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(["draft", "published", "archived"]).optional(),
  category: z.string().uuid().optional(),
  search: z.string().optional(),
})

export const createArticleSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  slug: z.string().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  contentHtml: z.string().optional(),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  categoryId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).default([]),
})

export const updateArticleSchema = createArticleSchema.partial()

export type ArticleQuery = z.infer<typeof articleQuerySchema>
export type CreateArticle = z.infer<typeof createArticleSchema>
export type UpdateArticle = z.infer<typeof updateArticleSchema>
