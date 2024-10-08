import {
	integer,
	pgTable,
	primaryKey,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core"

/** Users Table */
export const users = pgTable(
	`users`,
	{
		id: uuid(`id`).primaryKey().defaultRandom(),
		username: varchar(`username`, { length: 16 }).notNull(),
		email: varchar(`email`, { length: 254 }).notNull(),
		hash: varchar(`hash`, { length: 64 }).notNull(),
		salt: varchar(`salt`, { length: 36 }).notNull(),
	},
	(table) => ({
		usernameIdx: uniqueIndex(`users_username_unique`).on(table.username),
		emailIdx: uniqueIndex(`users_email_unique`).on(table.email),
	}),
)

/** Games Table */
export const games = pgTable(`games`, {
	id: uuid(`id`).primaryKey().defaultRandom(),
})

/** Players Table (Join Table for Users and Games) */
export const players = pgTable(
	`players`,
	{
		userId: uuid(`user_id`)
			.notNull()
			.references(() => users.id),
		gameId: uuid(`game_id`)
			.notNull()
			.references(() => games.id),
		score: integer(`score`).notNull(),
	},
	(table) => ({
		pk: primaryKey({
			columns: [table.userId, table.gameId],
		}),
	}),
)
