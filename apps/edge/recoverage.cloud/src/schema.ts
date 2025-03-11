import { relations, sql } from "drizzle-orm"
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"
import type { CoverageMap } from "istanbul-lib-coverage"

import type { JsonSummary } from "~/packages/recoverage/dist/recoverage"

import type { Json } from "./json"
import type { Role } from "./roles-permissions"

export const users = sqliteTable(`users`, {
	id: integer().primaryKey(),
	role: text().$type<Role>().default(`free`).notNull(),
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
export const projectsRelations = relations(projects, ({ many, one }) => ({
	tokens: many(tokens),
	reports: many(reports),
	user: one(users, {
		fields: [projects.userId],
		references: [users.id],
	}),
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
	project: one(projects, {
		fields: [tokens.projectId],
		references: [projects.id],
	}),
}))

export const reports = sqliteTable(
	`reports`,
	{
		ref: text().notNull(),
		projectId: text()
			.references(() => projects.id, { onDelete: `cascade` })
			.notNull(),
		data: text().notNull().$type<Json.stringified<CoverageMap>>(),
		jsonSummary: text().$type<Json.stringified<JsonSummary>>(),
		createdAt: text().notNull().default(sql`(current_timestamp)`),
	},
	(table) => [
		primaryKey({
			name: `projectIdRefPk`,
			columns: [table.projectId, table.ref],
		}),
	],
)

export const reportsRelations = relations(reports, ({ one }) => ({
	projects: one(projects, {
		fields: [reports.projectId],
		references: [projects.id],
	}),
}))
