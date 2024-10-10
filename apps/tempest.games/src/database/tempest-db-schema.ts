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

export const role = pgEnum(`role`, [`admin`, `user`])

export const USERNAME_MAX_LENGTH = 16
export const USERNAME_ALLOWED_CHARS = /^[a-zA-Z0-9_-]+$/

export const users = pgTable(
	`users`,
	{
		id: uuid().primaryKey().defaultRandom(),
		username: varchar({ length: 16 }).notNull(),
		email: varchar({ length: 254 }).notNull(),
		hash: varchar({ length: 64 }).notNull(),
		salt: varchar({ length: 36 }).notNull(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdIp: varchar({ length: 45 }).notNull(), // IP address length can be up to 45 characters (for IPv6)
		isActive: boolean().notNull().default(false),
		verifiedAt: timestamp({ withTimezone: true }),
		userRole: role().default(`user`),
	},
	(table) => ({
		usersUsernameUnique: uniqueIndex().on(table.username),
		usersEmailUnique: uniqueIndex().on(table.email),
	}),
)

export type UserColumnName = keyof typeof users._.columns
export const untrackedUserColumnNames = [
	`id`,
	`createdAt`,
	`createdIp`,
	`isActive`,
	`salt`,
	`verifiedAt`,
] as const satisfies UserColumnName[]
export const trackableUserColumnNames = [
	`username`,
	`email`,
	`hash`,
	`userRole`,
] as const satisfies UserColumnName[]
true satisfies UserColumnName extends
	| (typeof trackableUserColumnNames)[number]
	| (typeof untrackedUserColumnNames)[number]
	? true
	: false

export const trackedUserColumnName = pgEnum(
	`trackedUserColumnName`,
	trackableUserColumnNames,
)

export const userChanges = pgTable(`userChanges`, {
	id: uuid().primaryKey().defaultRandom(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	changedIp: varchar({ length: 45 }).notNull(),
	changedColumn: trackedUserColumnName().notNull(),
	oldValue: varchar({ length: 255 }),
	newValue: varchar({ length: 255 }),
})

export const games = pgTable(`games`, {
	id: uuid(`id`).primaryKey().defaultRandom(),
})

export const players = pgTable(
	`players`,
	{
		userId: uuid()
			.notNull()
			.references(() => users.id),
		gameId: uuid()
			.notNull()
			.references(() => games.id),
		score: integer().notNull(),
	},
	(table) => ({
		pk: primaryKey({
			columns: [table.userId, table.gameId],
		}),
	}),
)

export const loginHistory = pgTable(`loginHistory`, {
	id: uuid().primaryKey().defaultRandom(),
	userId: uuid().references(() => users.id),
	loginTime: timestamp({ withTimezone: true }).notNull().defaultNow(),
	ipAddress: varchar({ length: 45 }).notNull(),
	userAgent: varchar({ length: 1024 }),
	successful: boolean().notNull().default(false),
})

export const twoFactorMethod = pgEnum(`twoFactorMethod`, [`email`, `phone`])

export const passwordResetAttempts = pgTable(`passwordResetAttempts`, {
	id: uuid().primaryKey().defaultRandom(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
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
