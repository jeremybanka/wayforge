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

export const users = pgTable(
	`users`,
	{
		id: uuid().primaryKey().defaultRandom(),
		username: varchar({ length: 16 }).notNull(),
		email: varchar({ length: 254 }).notNull(),
		hash: varchar({ length: 64 }).notNull(),
		salt: varchar({ length: 36 }).notNull(),
		createdAt: timestamp().notNull().defaultNow(),
		createdIp: varchar({ length: 45 }), // IP address length can be up to 45 characters (for IPv6)
		isActive: boolean().notNull().default(true),
		verifiedAt: timestamp(),
		userRole: role().default(`user`),
	},
	(table) => ({
		usernameIdx: uniqueIndex(`users_username_unique`).on(table.username),
		emailIdx: uniqueIndex(`users_email_unique`).on(table.email),
	}),
)

export const trackableUserColumnNames = [
	`username`,
	`email`,
	`hash`,
	`userRole`,
] as const satisfies (keyof typeof users._.columns)[]

export const trackedUserColumnName = pgEnum(
	`tracked_user_columnName`,
	trackableUserColumnNames,
)

export const userChanges = pgTable(`user_changes`, {
	id: uuid().primaryKey().defaultRandom(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	changedAt: timestamp().notNull().defaultNow(),
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

export const loginHistory = pgTable(`login_history`, {
	id: uuid().primaryKey().defaultRandom(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	loginTime: timestamp().notNull().defaultNow(),
	ipAddress: varchar({ length: 45 }).notNull(),
	userAgent: varchar({ length: 1024 }),
	geoLocation: varchar({ length: 255 }),
	successful: boolean().notNull().default(true),
})

export const twoFactorMethod = pgEnum(`two_factor_method`, [`email`, `phone`])

export const passwordResetAttempts = pgTable(`password_reset_attempts`, {
	id: uuid().primaryKey().defaultRandom(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	requestedIp: varchar({ length: 45 }).notNull(),
	requestedAt: timestamp().notNull().defaultNow(),
	succeededIp: varchar({ length: 45 }),
	succeededAt: timestamp(),
	verificationMethod: twoFactorMethod().notNull(),
})

export const banishedIps = pgTable(`banished_ips`, {
	ip: varchar({ length: 45 }).notNull(),
	reason: varchar({ length: 2048 }).notNull(),
	banishedAt: timestamp().notNull().defaultNow(),
	banishedUntil: timestamp().notNull(),
})
