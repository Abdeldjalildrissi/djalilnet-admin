import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
  integer,
  pgEnum,
  index,
  uniqueIndex,
  serial,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ─── ENUMS ──────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "editor",
  "author",
  "viewer",
])

export const articleStatusEnum = pgEnum("article_status", [
  "draft",
  "published",
  "archived",
])

export const emailDirectionEnum = pgEnum("email_direction", [
  "inbound",
  "outbound",
])

export const emailStatusEnum = pgEnum("email_status", [
  "received",
  "sent",
  "draft",
  "failed",
  "bounced",
])

export const queueStatusEnum = pgEnum("queue_status", [
  "pending",
  "processing",
  "completed",
  "failed",
])

// ─── USERS ──────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").default("author").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
    roleIdx: index("users_role_idx").on(t.role),
    activeIdx: index("users_active_idx").on(t.isActive),
  })
)

// Better Auth required tables
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("sessions_token_idx").on(t.token),
    userIdIdx: index("sessions_user_id_idx").on(t.userId),
    expiresIdx: index("sessions_expires_idx").on(t.expiresAt),
  })
)

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdIdx: index("accounts_user_id_idx").on(t.userId),
  })
)

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 7 }).default("#3B82F6"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex("categories_slug_idx").on(t.slug),
    nameIdx: uniqueIndex("categories_name_idx").on(t.name),
  })
)

// ─── ARTICLES ────────────────────────────────────────────────────────────────

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 600 }).notNull(),
    excerpt: text("excerpt"),
    content: jsonb("content"),
    contentHtml: text("content_html"),
    coverImage: text("cover_image"),
    status: articleStatusEnum("status").default("draft").notNull(),
    tags: text("tags").array().default([]),
    readingTime: integer("reading_time"),
    viewCount: integer("view_count").default(0).notNull(),
    authorId: text("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex("articles_slug_idx").on(t.slug),
    statusIdx: index("articles_status_idx").on(t.status),
    authorIdx: index("articles_author_id_idx").on(t.authorId),
    categoryIdx: index("articles_category_id_idx").on(t.categoryId),
    publishedIdx: index("articles_published_at_idx").on(t.publishedAt),
    updatedIdx: index("articles_updated_at_idx").on(t.updatedAt),
  })
)

// ─── EMAIL TEMPLATES ─────────────────────────────────────────────────────────

export const emailTemplates = pgTable(
  "email_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    bodyHtml: text("body_html").notNull(),
    bodyText: text("body_text"),
    variables: text("variables").array().default([]),
    isActive: boolean("is_active").default(true).notNull(),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    nameIdx: uniqueIndex("email_templates_name_idx").on(t.name),
    activeIdx: index("email_templates_active_idx").on(t.isActive),
  })
)

// ─── EMAILS ──────────────────────────────────────────────────────────────────

export const emails = pgTable(
  "emails",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    direction: emailDirectionEnum("direction").notNull(),
    fromAddress: varchar("from_address", { length: 255 }).notNull(),
    toAddress: varchar("to_address", { length: 255 }).notNull(),
    ccAddresses: varchar("cc_addresses", { length: 1000 }),
    subject: varchar("subject", { length: 500 }).notNull(),
    bodyHtml: text("body_html"),
    bodyText: text("body_text"),
    status: emailStatusEnum("status").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    isStarred: boolean("is_starred").default(false).notNull(),
    resendId: varchar("resend_id", { length: 255 }),
    openedAt: timestamp("opened_at"),
    clickedAt: timestamp("clicked_at"),
    failureReason: text("failure_reason"),
    retryCount: integer("retry_count").default(0),
    templateId: uuid("template_id").references(() => emailTemplates.id, {
      onDelete: "set null",
    }),
    sentById: text("sent_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    sentAt: timestamp("sent_at"),
    receivedAt: timestamp("received_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    directionIdx: index("emails_direction_idx").on(t.direction),
    statusIdx: index("emails_status_idx").on(t.status),
    isReadIdx: index("emails_is_read_idx").on(t.isRead),
    fromIdx: index("emails_from_address_idx").on(t.fromAddress),
    receivedAtIdx: index("emails_received_at_idx").on(t.receivedAt),
    inboxIdx: index("emails_inbox_idx").on(
      t.direction,
      t.status,
      t.receivedAt
    ),
  })
)

// ─── EMAIL QUEUE ─────────────────────────────────────────────────────────────

export const emailQueue = pgTable("email_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  bullJobId: varchar("bull_job_id", { length: 255 }),
  toAddress: varchar("to_address", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyHtml: text("body_html"),
  templateId: uuid("template_id"),
  status: queueStatusEnum("status").default("pending").notNull(),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  error: text("error"),
  scheduledAt: timestamp("scheduled_at"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 100 }).notNull(),
    resourceId: uuid("resource_id"),
    resourceType: varchar("resource_type", { length: 50 }),
    metadata: jsonb("metadata").default({}),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdIdx: index("activity_logs_user_id_idx").on(t.userId),
    actionIdx: index("activity_logs_action_idx").on(t.action),
    createdIdx: index("activity_logs_created_at_idx").on(t.createdAt),
  })
)

// ─── RELATIONS ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  articles: many(articles),
  sessions: many(sessions),
  sentEmails: many(emails),
  activityLogs: many(activityLogs),
}))

export const articlesRelations = relations(articles, ({ one }) => ({
  author: one(users, { fields: [articles.authorId], references: [users.id] }),
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id],
  }),
}))

export const emailsRelations = relations(emails, ({ one }) => ({
  sentBy: one(users, { fields: [emails.sentById], references: [users.id] }),
  template: one(emailTemplates, {
    fields: [emails.templateId],
    references: [emailTemplates.id],
  }),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles),
}))

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Article = typeof articles.$inferSelect
export type NewArticle = typeof articles.$inferInsert
export type Category = typeof categories.$inferSelect
export type Email = typeof emails.$inferSelect
export type EmailTemplate = typeof emailTemplates.$inferSelect
export type ActivityLog = typeof activityLogs.$inferSelect


// ─── DJALILNET LEGACY FORMS & ANALYTICS ─────────────────────────────────────

// Contact form submissions log
export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 200 }).notNull(),
    message: text("message").notNull(),
    ip: varchar("ip", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    resolved: boolean("resolved").default(false).notNull(),
  },
  (table) => [
    index("idx_contacts_email").on(table.email),
    index("idx_contacts_created_at").on(table.createdAt),
  ],
);

// Blog post view counts
export const pageViews = pgTable(
  "page_views",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    views: integer("views").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_page_views_slug").on(table.slug)],
);

// Newsletter subscriptions
export const subscribers = pgTable(
  "subscribers",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
    active: boolean("active").default(true).notNull(),
  },
  (table) => [index("idx_subscribers_email").on(table.email)],
);

// ─── PROFILE & RESUME ─────────────────────────────────────────────────────────

export const experiences = pgTable("experiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: varchar("company", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  period: varchar("period", { length: 100 }).notNull(), // e.g., "Apr 2025 – Present"
  location: varchar("location", { length: 255 }),
  current: boolean("current").default(false).notNull(),
  bullets: jsonb("bullets").default([]).notNull(), // array of strings
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const educations = pgTable("educations", {
  id: uuid("id").primaryKey().defaultRandom(),
  degree: varchar("degree", { length: 255 }).notNull(),
  school: varchar("school", { length: 255 }).notNull(),
  period: varchar("period", { length: 100 }).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const certifications = pgTable("certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  issuer: varchar("issuer", { length: 255 }).notNull(),
  date: varchar("date", { length: 50 }),
  focus: text("focus"),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'technical', 'software', 'language'
  level: integer("level"), // Optional: 1-100
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const siteSettings = pgTable("site_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(), // e.g., 'personal_info'
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  name: text("name").notNull(),
  type: varchar("type", { length: 100 }).notNull(), // e.g., 'image/png', 'image/jpeg'
  key: text("key").notNull(), // uploadthing file key
  size: integer("size"), // file size in bytes
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
