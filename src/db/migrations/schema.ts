import { pgTable, uuid, varchar, text, integer, timestamp, index, serial, boolean, unique, jsonb, uniqueIndex, foreignKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const articleStatus = pgEnum("article_status", ['draft', 'published', 'archived'])
export const emailDirection = pgEnum("email_direction", ['inbound', 'outbound'])
export const emailStatus = pgEnum("email_status", ['received', 'sent', 'draft', 'failed', 'bounced'])
export const userRole = pgEnum("user_role", ['super_admin', 'editor', 'author', 'viewer'])


export const certifications = pgTable("certifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	issuer: varchar({ length: 255 }).notNull(),
	date: varchar({ length: 50 }),
	focus: text(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 200 }).notNull(),
	message: text().notNull(),
	ip: varchar({ length: 45 }),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	resolved: boolean().default(false).notNull(),
}, (table) => [
	index("idx_contacts_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_contacts_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const subscribers = pgTable("subscribers", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	subscribedAt: timestamp("subscribed_at", { mode: 'string' }).defaultNow().notNull(),
	active: boolean().default(true).notNull(),
}, (table) => [
	index("idx_subscribers_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("subscribers_email_unique").on(table.email),
]);

export const pageViews = pgTable("page_views", {
	id: serial().primaryKey().notNull(),
	slug: varchar({ length: 255 }).notNull(),
	views: serial().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_page_views_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("page_views_slug_unique").on(table.slug),
]);

export const educations = pgTable("educations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	degree: varchar({ length: 255 }).notNull(),
	school: varchar({ length: 255 }).notNull(),
	period: varchar({ length: 100 }).notNull(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const experiences = pgTable("experiences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	company: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 255 }).notNull(),
	period: varchar({ length: 100 }).notNull(),
	location: varchar({ length: 255 }),
	current: boolean().default(false).notNull(),
	bullets: jsonb().default([]).notNull(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar({ length: 100 }).notNull(),
	value: jsonb().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("site_settings_key_unique").on(table.key),
]);

export const skills = pgTable("skills", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	category: varchar({ length: 50 }).notNull(),
	level: integer(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	name: varchar({ length: 100 }).notNull(),
	avatarUrl: text("avatar_url"),
	role: userRole().default('author').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("users_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	uniqueIndex("users_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("users_role_idx").using("btree", table.role.asc().nullsLast().op("enum_ops")),
]);

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 120 }).notNull(),
	description: text(),
	color: varchar({ length: 7 }).default('#3B82F6'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("categories_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	uniqueIndex("categories_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
]);

export const verifications = pgTable("verifications", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	idToken: text("id_token"),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("accounts_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const activityLogs = pgTable("activity_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id"),
	action: varchar({ length: 100 }).notNull(),
	resourceId: uuid("resource_id"),
	resourceType: varchar("resource_type", { length: 50 }),
	metadata: jsonb().default({}),
	ipAddress: varchar("ip_address", { length: 45 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("activity_logs_action_idx").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("activity_logs_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("activity_logs_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activity_logs_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const articles = pgTable("articles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 500 }).notNull(),
	slug: varchar({ length: 600 }).notNull(),
	excerpt: text(),
	content: jsonb(),
	contentHtml: text("content_html"),
	coverImage: text("cover_image"),
	status: articleStatus().default('draft').notNull(),
	tags: text().array().default([""]),
	readingTime: integer("reading_time"),
	viewCount: integer("view_count").default(0).notNull(),
	authorId: text("author_id"),
	categoryId: uuid("category_id"),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("articles_author_id_idx").using("btree", table.authorId.asc().nullsLast().op("text_ops")),
	index("articles_category_id_idx").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("articles_published_at_idx").using("btree", table.publishedAt.asc().nullsLast().op("timestamp_ops")),
	uniqueIndex("articles_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("articles_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("articles_updated_at_idx").using("btree", table.updatedAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "articles_category_id_categories_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "articles_author_id_users_id_fk"
		}).onDelete("set null"),
]);

export const emailTemplates = pgTable("email_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	bodyHtml: text("body_html").notNull(),
	bodyText: text("body_text"),
	variables: text().array().default([""]),
	isActive: boolean("is_active").default(true).notNull(),
	createdById: text("created_by_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("email_templates_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	uniqueIndex("email_templates_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "email_templates_created_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const emails = pgTable("emails", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	direction: emailDirection().notNull(),
	fromAddress: varchar("from_address", { length: 255 }).notNull(),
	toAddress: varchar("to_address", { length: 255 }).notNull(),
	ccAddresses: varchar("cc_addresses", { length: 1000 }),
	subject: varchar({ length: 500 }).notNull(),
	bodyHtml: text("body_html"),
	bodyText: text("body_text"),
	status: emailStatus().notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	isStarred: boolean("is_starred").default(false).notNull(),
	resendId: varchar("resend_id", { length: 255 }),
	templateId: uuid("template_id"),
	sentById: text("sent_by_id"),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	receivedAt: timestamp("received_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("emails_direction_idx").using("btree", table.direction.asc().nullsLast().op("enum_ops")),
	index("emails_from_address_idx").using("btree", table.fromAddress.asc().nullsLast().op("text_ops")),
	index("emails_inbox_idx").using("btree", table.direction.asc().nullsLast().op("timestamp_ops"), table.status.asc().nullsLast().op("enum_ops"), table.receivedAt.asc().nullsLast().op("enum_ops")),
	index("emails_is_read_idx").using("btree", table.isRead.asc().nullsLast().op("bool_ops")),
	index("emails_received_at_idx").using("btree", table.receivedAt.asc().nullsLast().op("timestamp_ops")),
	index("emails_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [emailTemplates.id],
			name: "emails_template_id_email_templates_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sentById],
			foreignColumns: [users.id],
			name: "emails_sent_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("sessions_expires_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	uniqueIndex("sessions_token_idx").using("btree", table.token.asc().nullsLast().op("text_ops")),
	index("sessions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);
