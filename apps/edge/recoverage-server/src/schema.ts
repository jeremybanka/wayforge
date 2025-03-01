import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const users = sqliteTable(`users`, {
	id: integer().primaryKey(),
	githubId: integer().unique(),
	createdAt: integer({ mode: `timestamp` })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
})

export const tokens = sqliteTable(`tokens`, {
	selector: text().primaryKey(),
	userId: integer()
		.references(() => users.id)
		.notNull(),
	verifierHash: text().notNull(), // Hashed portion of the token for security
	createdAt: integer({ mode: `timestamp` })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
})

export const projects = sqliteTable(`projects`, {
	id: text().primaryKey(),
	userId: integer()
		.references(() => users.id)
		.notNull(),
	name: text().notNull(),
})

export const reports = sqliteTable(`reports`, {
	id: text().primaryKey(),
	projectId: text()
		.references(() => projects.id)
		.notNull(),
	data: text().notNull(),
	createdAt: integer({ mode: `timestamp` })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
})
