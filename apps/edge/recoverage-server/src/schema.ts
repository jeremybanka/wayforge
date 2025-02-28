import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const users = sqliteTable(`users`, {
	id: integer(`id`).primaryKey(),
	createdAt: integer(`created_at`, { mode: `timestamp` })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
})

export const tokens = sqliteTable(`tokens`, {
	selector: text(`selector`).primaryKey(),
	userId: integer(`user_id`)
		.references(() => users.id)
		.notNull(),
	verifierHash: text(`verifier_hash`).notNull(), // Hashed portion of the token for security
	createdAt: integer(`created_at`, { mode: `timestamp` })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
})

export const reports = sqliteTable(`reports`, {
	id: text(`id`).primaryKey(),
	userId: integer(`user_id`)
		.references(() => users.id)
		.notNull(),
	data: text(`data`).notNull(),
	createdAt: integer(`created_at`, { mode: `timestamp` })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
})
