import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const users = sqliteTable(`users`, {
	id: integer().primaryKey(),
	createdAt: text().notNull().default(sql`(current_timestamp)`),
})

export const tokens = sqliteTable(`tokens`, {
	selector: text().primaryKey(),
	projectId: integer()
		.references(() => projects.id)
		.notNull(),
	verifierHash: text().notNull(), // Hashed portion of the token for security
	createdAt: text().notNull().default(sql`(current_timestamp)`),
})

export const projects = sqliteTable(`projects`, {
	id: text().primaryKey(),
	userId: integer()
		.references(() => users.id)
		.notNull(),
	name: text().notNull(),
	createdAt: text().notNull().default(sql`(current_timestamp)`),
})

export const reports = sqliteTable(`reports`, {
	id: text().primaryKey(),
	projectId: text()
		.references(() => projects.id)
		.notNull(),
	data: text().notNull(),
	createdAt: text().notNull().default(sql`(current_timestamp)`),
})
