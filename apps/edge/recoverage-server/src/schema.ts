import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const users = sqliteTable(`users`, {
	id: integer().primaryKey(),
	createdAt: text().notNull().default(sql`(current_timestamp)`),
})

export const projects = sqliteTable(`projects`, {
	id: text().primaryKey(),
	userId: integer()
		.references(() => users.id, { onDelete: `cascade` })
		.notNull(),
	name: text().notNull(),
	createdAt: text().notNull().default(sql`(current_timestamp)`),
})
export const projectsRelations = relations(projects, ({ many }) => ({
	tokens: many(tokens),
	reports: many(reports),
}))

export const tokens = sqliteTable(`tokens`, {
	id: text().primaryKey(),
	name: text().notNull(),
	hash: text().notNull(),
	salt: text().notNull(),
	projectId: text()
		.references(() => projects.id, { onDelete: `cascade` })
		.notNull(),
	createdAt: text().notNull().default(sql`(current_timestamp)`),
})

export const tokensRelations = relations(tokens, ({ one }) => ({
	projects: one(projects, {
		fields: [tokens.projectId],
		references: [projects.id],
	}),
}))

export const reports = sqliteTable(`reports`, {
	id: text().primaryKey(),
	projectId: text()
		.references(() => projects.id, { onDelete: `cascade` })
		.notNull(),
	data: text().notNull(),
	createdAt: text().notNull().default(sql`(current_timestamp)`),
})

export const reportsRelations = relations(reports, ({ one }) => ({
	projects: one(projects, {
		fields: [reports.projectId],
		references: [projects.id],
	}),
}))
