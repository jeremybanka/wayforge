import type { SQL } from "drizzle-orm"
import { sql } from "drizzle-orm"
import type { AnyPgColumn } from "drizzle-orm/pg-core"
import {
	boolean,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core"

function lower(email: AnyPgColumn): SQL {
	return sql`lower(${email})`
}

export const role = pgEnum(`role`, [`admin`, `user`])

export const users = pgTable(
	`users`,
	{
		id: uuid().primaryKey().defaultRandom(),
		username: varchar({ length: 16 }).notNull(),
		emailOffered: varchar({ length: 254 }).notNull(),
		emailVerified: varchar({ length: 254 }),
		password: varchar({ length: 254 }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdIp: varchar({ length: 45 }).notNull(), // IP address length can be up to 45 characters (for IPv6)
		isActive: boolean().notNull().default(false),
		verifiedAt: timestamp({ withTimezone: true }),
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
	`createdAt`,
	`createdIp`,
	`isActive`,
	`verifiedAt`,
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
	expiresAt: timestamp({ withTimezone: true }).notNull(),
})

export type AccountAction = typeof accountActions.$inferSelect
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
	signInTime: timestamp({ withTimezone: true }).notNull().defaultNow(),
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
	requestedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	succeededIp: varchar({ length: 45 }),
	succeededAt: timestamp({ withTimezone: true }),
	verificationMethod: twoFactorMethod().notNull(),
})

export const banishedIps = pgTable(`banishedIps`, {
	ip: varchar({ length: 45 }).primaryKey(),
	reason: varchar({ length: 2048 }).notNull(),
	banishedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	banishedUntil: timestamp({ withTimezone: true }),
})
