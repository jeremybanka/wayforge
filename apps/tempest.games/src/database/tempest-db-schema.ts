import type { SQL } from "drizzle-orm"
import { sql } from "drizzle-orm"
import type { AnyPgColumn } from "drizzle-orm/pg-core"
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core"

import type { ISO8601 } from "../backend/time"
import type { Username } from "../library/data-constraints"

function iso8601() {
	return varchar({ length: 24 }).$type<ISO8601>()
}

function lower(email: AnyPgColumn): SQL {
	return sql`lower(${email})`
}

const ISO_NOW = sql<ISO8601>`TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`

export const role = pgEnum(`role`, [`admin`, `user`])

export const users = pgTable(
	`users`,
	{
		id: uuid().primaryKey().defaultRandom(),
		username: varchar({ length: 16 }).$type<Username>().notNull(),
		emailOffered: varchar({ length: 254 }).notNull(),
		emailVerified: varchar({ length: 254 }),
		password: varchar({ length: 254 }),
		createdAtIso: iso8601().notNull().default(ISO_NOW),
		createdIp: varchar({ length: 45 }).notNull(), // IP address length can be up to 45 characters (for IPv6)
		isActive: boolean().notNull().default(false),
		verifiedAtIso: iso8601(),
		userRole: role().default(`user`),
	},
	(table) => [
		uniqueIndex(`usernameUniqueIndex`).on(lower(table.username)),
		uniqueIndex(`emailVerifiedUniqueIndex`).on(lower(table.emailVerified)),
	],
)

export type UserColumnName = keyof typeof users._.columns
export const untrackedUserColumnNames = [
	`id`,
	`createdAtIso`,
	`createdIp`,
	`isActive`,
	`verifiedAtIso`,
] as const satisfies UserColumnName[]
export const trackableUserColumnNames = [
	`username`,
	`emailOffered`,
	`emailVerified`,
	`password`,
	`userRole`,
] as const satisfies UserColumnName[]
;`` as UserColumnName satisfies
	| (typeof trackableUserColumnNames)[number]
	| (typeof untrackedUserColumnNames)[number]

export const trackedUserColumnName = pgEnum(
	`trackedUserColumnName`,
	trackableUserColumnNames,
)

export const accountAction = pgEnum(`accountAction`, [
	`cooldown`,
	`confirmEmail`,
	`signIn`,
	`resetPassword`,
])

export const accountActions = pgTable(`accountActions`, {
	userId: uuid()
		.references(() => users.id)
		.primaryKey(),
	action: accountAction().notNull(),
	code: varchar({ length: 254 }).notNull(),
	wrongCodeCount: integer().notNull().default(0),
	expiresAtIso: iso8601().notNull(),
})

export type AccountAction = typeof accountActions.$inferSelect
export type AccountActionType = AccountAction[`action`]
export type AccountActionTypeActual = Exclude<AccountActionType, `cooldown`>
export type AccountActionInsert = typeof accountActions.$inferInsert
export type AccountActionUpdate = Partial<AccountActionInsert>

export const games = pgTable(`games`, {
	id: uuid().primaryKey().defaultRandom(),
})

export const players = pgTable(
	`players`,
	{
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: `cascade` }),
		gameId: uuid()
			.notNull()
			.references(() => games.id, { onDelete: `cascade` }),
		score: integer().notNull(),
	},
	(table) => [
		primaryKey({
			name: `players_userId_gameId_pk`,
			columns: [table.userId, table.gameId],
		}),
	],
)

export const signInHistory = pgTable(`signInHistory`, {
	id: uuid().primaryKey().defaultRandom(),
	userId: uuid().references(() => users.id, { onDelete: `cascade` }),
	signInTimeIso: iso8601().notNull().default(ISO_NOW),
	ipAddress: varchar({ length: 45 }).notNull(),
	userAgent: varchar({ length: 1024 }),
	successful: boolean().notNull().default(false),
})

export const twoFactorMethod = pgEnum(`twoFactorMethod`, [`email`, `phone`])

export const passwordResetAttempts = pgTable(`passwordResetAttempts`, {
	id: uuid().primaryKey().defaultRandom(),
	userId: uuid()
		.notNull()
		.references(() => users.id, { onDelete: `cascade` }),
	requestedIp: varchar({ length: 45 }).notNull(),
	requestedAtIso: iso8601().notNull().default(ISO_NOW),
	succeededIp: varchar({ length: 45 }),
	succeededAtIso: iso8601(),
	verificationMethod: twoFactorMethod().notNull(),
})

export const banishedIps = pgTable(`banishedIps`, {
	ip: varchar({ length: 45 }).primaryKey(),
	reason: varchar({ length: 2048 }).notNull(),
	banishedAtIso: iso8601().notNull().default(ISO_NOW),
	banishedUntilIso: iso8601(),
})
export const userSessions = pgTable(
	`userSessions`,
	{
		sessionKey: uuid().notNull().primaryKey(),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: `cascade` }),
		createdAtIso: iso8601().notNull().default(ISO_NOW),
	},
	(table) => [index(`userIdIndex`).on(table.userId)],
)

// carbiter

export const meal = pgEnum(`meal`, [
	`breakfast`,
	`brunch`,
	`lunch`,
	`tea`,
	`dinner`,
	`supper`,
])

export const foodItems = pgTable(`foodItem`, {
	userId: uuid().references(() => users.id, { onDelete: `cascade` }),
	id: uuid().primaryKey().defaultRandom(),
	year: integer().notNull(),
	month: integer().notNull(),
	day: integer().notNull(),
	meal: meal().notNull(),
	name: varchar({ length: 254 }).notNull(),
	carbs: integer().notNull(),
	protein: integer().notNull(),
})
