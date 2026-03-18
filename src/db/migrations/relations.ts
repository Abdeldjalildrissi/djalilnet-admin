import { relations } from "drizzle-orm/relations";
import { users, accounts, activityLogs, categories, articles, emailTemplates, emails, sessions } from "./schema";

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	accounts: many(accounts),
	activityLogs: many(activityLogs),
	articles: many(articles),
	emailTemplates: many(emailTemplates),
	emails: many(emails),
	sessions: many(sessions),
}));

export const activityLogsRelations = relations(activityLogs, ({one}) => ({
	user: one(users, {
		fields: [activityLogs.userId],
		references: [users.id]
	}),
}));

export const articlesRelations = relations(articles, ({one}) => ({
	category: one(categories, {
		fields: [articles.categoryId],
		references: [categories.id]
	}),
	user: one(users, {
		fields: [articles.authorId],
		references: [users.id]
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	articles: many(articles),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({one, many}) => ({
	user: one(users, {
		fields: [emailTemplates.createdById],
		references: [users.id]
	}),
	emails: many(emails),
}));

export const emailsRelations = relations(emails, ({one}) => ({
	emailTemplate: one(emailTemplates, {
		fields: [emails.templateId],
		references: [emailTemplates.id]
	}),
	user: one(users, {
		fields: [emails.sentById],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));