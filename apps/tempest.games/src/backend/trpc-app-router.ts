import path from "node:path"

import { Temporal } from "@js-temporal/polyfill"
import { TRPCError } from "@trpc/server"
import { type } from "arktype"
import { and, eq, gt, isNull } from "drizzle-orm"

import type {
	AccountActionTypeActual,
	AccountActionUpdate,
} from "../database/tempest-db-schema"
import {
	accountActions,
	banishedIps,
	signInHistory,
	users,
	userSessions,
} from "../database/tempest-db-schema"
import type { ClientAuthData, Username } from "../library/data-constraints"
import { credentialsType, usernameType } from "../library/data-constraints"
import { env } from "../library/env"
import { simpleFormatMs } from "../library/simple-format-ms"
import { genAccountActionCode } from "./account-actions"
import { carbiterRouter } from "./carbiter/trpc-carbiter-router"
import { sendEmailToConfirmAccountAction } from "./email"
import { loggedProcedure, userSessionProcedure } from "./procedures"
import { decryptId, encryptId } from "./secrecy"
import { instant, iso8601 } from "./time"
import type { Context } from "./trpc-server"
import { trpc } from "./trpc-server"
import { createSession, isSessionRecent } from "./user-sessions"

interface VerifyAccountActionResponse extends ClientAuthData {
	action: AccountActionTypeActual
}

type AuthTriageResponse = {
	nextStep: `otc_login` | `otc_verify` | `password_login`
	userKey: string
}

export type AppRouter = typeof appRouter

export const appRouter = trpc.router({
	carbiter: carbiterRouter,

	version: loggedProcedure.query(async () => {
		const relative = env.RUN_WORKERS_FROM_SOURCE ? `../..` : `..`
		const { version } = await Bun.file(
			path.resolve(import.meta.dir, relative, `package.json`),
		).json()
		const changelog = await Bun.file(
			path.resolve(import.meta.dir, relative, `CHANGELOG.md`),
		).text()
		const resType = type({
			version: `string`,
			changelog: `string`,
		})
		const versionData = resType({ version, changelog })
		if (versionData instanceof type.errors) {
			throw new TRPCError({
				code: `INTERNAL_SERVER_ERROR`,
				message: `Failed to parse version data.`,
			})
		}
		return versionData
	}),

	offerNewEmail: userSessionProcedure
		.input(type({ emailOffered: `string.email`, "+": `delete` }))
		.mutation(async ({ input, ctx }): Promise<AuthTriageResponse> => {
			const { emailOffered } = input
			const { userId, sessionKey, now } = ctx

			const sessionIsRecent = await isSessionRecent(sessionKey, now)
			if (sessionIsRecent) {
				void ctx.db.drizzle
					.update(users)
					.set({ emailOffered })
					.where(eq(users.id, userId))
					.returning()
					.then(async ([user]) => {
						const { emailVerified, username } = user
						if (!emailVerified) {
							throw new TRPCError({
								code: `BAD_REQUEST`,
								message: `Please verify your email address before resetting your password.`,
							})
						}
						await initiateAccountAction({
							email: emailVerified,
							username,
							userId,
							action: `confirmEmail`,
							ctx,
						})
					})
					.catch((thrown) => {
						if (Error.isError(thrown)) {
							ctx.logger.error(thrown.message)
						}
					})
				const userKey = encryptId(userId)

				return {
					nextStep: `otc_verify`,
					userKey,
				}
			}
			const user = await ctx.db.drizzle.query.users.findFirst({
				columns: { username: true, emailVerified: true },
				where: eq(users.id, userId),
			})

			if (!user) {
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `User not found.`,
				})
			}
			const { username, emailVerified } = user
			if (!emailVerified) {
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `Please verify your email address before resetting your password.`,
				})
			}

			void initiateAccountAction({
				email: emailVerified,
				username,
				userId,
				action: `signIn`,
				ctx,
			})
			return {
				nextStep: `otc_login`,
				userKey: encryptId(userId),
			}
		}),

	openSession: loggedProcedure
		.input(credentialsType)
		.mutation(async ({ input, ctx }): Promise<ClientAuthData> => {
			const { email, password } = input
			let successful = false
			let userId: string | null = null
			try {
				ctx.logger.info(`🔑 sign in attempt as user with email`, email)
				const tenMinutesAgo = iso8601(ctx.now.subtract({ minutes: 10 }))
				const recentFailures = await ctx.db.drizzle.query.signInHistory.findMany(
					{
						columns: { userId: true, successful: true, signInTimeIso: true },
						where: and(
							eq(signInHistory.ipAddress, ctx.ip),
							eq(signInHistory.successful, false),
							gt(signInHistory.signInTimeIso, tenMinutesAgo),
						),
						limit: 10,
					},
				)
				const attemptsRemaining = 10 - recentFailures.length
				if (attemptsRemaining < 1) {
					await ctx.db.drizzle.insert(banishedIps).values({
						ip: ctx.ip,
						reason: `Too many recent sign in attempts.`,
						banishedAtIso: iso8601(ctx.now),
						banishedUntilIso: iso8601(ctx.now.add({ hours: 24 })),
					})
					throw new TRPCError({
						code: `TOO_MANY_REQUESTS`,
						message: `Too many recent sign in attempts.`,
					})
				}
				const user = await ctx.db.drizzle.query.users.findFirst({
					columns: {
						id: true,
						emailVerified: true,
						password: true,
						username: true,
					},
					where: eq(users.emailVerified, email),
				})
				if (!user) {
					throw new TRPCError({
						code: `BAD_REQUEST`,
						message: `${attemptsRemaining} attempts remaining.`,
					})
				}
				userId = user.id
				if (!user.password) {
					throw new TRPCError({
						code: `BAD_REQUEST`,
						message: `Sign in with a link.`,
					})
				}
				const { password: userPassword, username } = user
				const match = await Bun.password.verify(password, userPassword)
				if (!match) {
					throw new TRPCError({
						code: `BAD_REQUEST`,
						message: `${attemptsRemaining} attempts remaining.`,
					})
				}

				const sessionKey = await createSession(userId, ctx)
				successful = true
				ctx.logger.info(`🔑 sign in successful as`, email)
				ctx.res.setHeader(
					`Set-Cookie`,
					`sessionKey=${sessionKey}; HttpOnly; Max-Age=${60 * 60 * 24 * 7}; Path=/`,
				)
				return {
					userId,
					email,
					username,
					password: true,
					verification: `verified`,
				}
			} finally {
				await ctx.db.drizzle.insert(signInHistory).values({
					userId,
					successful,
					ipAddress: ctx.ip,
					userAgent: ctx.req.headers[`user-agent`] ?? `Withheld`,
					signInTimeIso: iso8601(ctx.now),
				})
				ctx.logger.info(`🔑 recorded sign in attempt from`, ctx.ip)
			}
		}),

	closeSession: userSessionProcedure
		.input(type({ username: `string` }))
		.mutation(({ ctx }) => {
			const { sessionKey } = ctx
			ctx.db.drizzle
				.delete(userSessions)
				.where(eq(userSessions.sessionKey, sessionKey))
		}),

	verifyAccountAction: loggedProcedure
		.input(type({ oneTimeCode: `string`, userKey: `string`, "+": `delete` }))
		.mutation(async ({ input, ctx }): Promise<VerifyAccountActionResponse> => {
			const { oneTimeCode, userKey } = input
			ctx.logger.info(`🔑 verifying account action token:`, oneTimeCode)

			const userId = decryptId(userKey)
			const user = await ctx.db.drizzle.query.users.findFirst({
				columns: {
					id: true,
					emailOffered: true,
					emailVerified: true,
					username: true,
					password: true,
				},
				where: eq(users.id, userId),
			})

			if (!user) {
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `User not found.`,
				})
			}

			const accountAction = await ctx.db.drizzle.query.accountActions.findFirst({
				columns: {
					action: true,
					expiresAtIso: true,
					wrongCodeCount: true,
					code: true,
				},
				where: eq(accountActions.userId, user.id),
			})

			if (!accountAction) {
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `Account action not found.`,
				})
			}

			const { action } = accountAction
			if (action === `cooldown`) {
				const cooldownDuration = instant(accountAction.expiresAtIso).since(
					ctx.now,
				)
				const cooldownMs = cooldownDuration.total({ unit: `milliseconds` })
				const cooldownString = simpleFormatMs(cooldownMs)
				throw new TRPCError({
					code: `TOO_MANY_REQUESTS`,
					message: `You must wait ${cooldownString} before attempting to perform this action again.`,
				})
			}

			const tokenIsCorrect = await Bun.password.verify(
				oneTimeCode,
				accountAction.code,
			)

			if (!tokenIsCorrect) {
				ctx.logger.info(`🔑❌ account action token is incorrect`)
				const newWrongCodeCount = accountAction.wrongCodeCount + 1
				let actionUpdate: AccountActionUpdate
				if (newWrongCodeCount >= 3) {
					actionUpdate = {
						action: `cooldown`,
						code: accountAction.code,
						expiresAtIso: iso8601(ctx.now.add({ minutes: 15 })),
					}
				} else {
					actionUpdate = { wrongCodeCount: newWrongCodeCount }
				}
				await ctx.db.drizzle
					.update(accountActions)
					.set(actionUpdate)
					.where(eq(accountActions.code, accountAction.code))

				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `Account action token is incorrect.`,
				})
			}

			let email = user.emailVerified ?? user.emailOffered
			let password = Boolean(user.password)
			let verification = user.emailVerified
				? (`verified` as const)
				: (`unverified` as const)
			switch (action) {
				case `signIn`: {
					break
				}
				case `confirmEmail`: {
					await ctx.db.drizzle
						.update(users)
						.set({ emailVerified: user.emailOffered })
						.where(eq(users.id, user.id))
					email = user.emailOffered
					verification = `verified`
					break
				}
				case `resetPassword`: {
					await ctx.db.drizzle
						.update(users)
						.set({ password: null })
						.where(eq(users.id, user.id))
					password = false
				}
			}
			await ctx.db.drizzle
				.delete(accountActions)
				.where(eq(accountActions.userId, user.id))
			const { username } = user
			const sessionKey = await createSession(user.id, ctx)
			ctx.res.setHeader(
				`Set-Cookie`,
				`sessionKey=${sessionKey}; HttpOnly; Max-Age=${60 * 60 * 24 * 7}; Path=/`,
			)
			return {
				userId,
				email,
				username,
				password,
				verification,
				action,
			}
		}),

	startPasswordReset: loggedProcedure
		.input(type({ userKey: `string`, "+": `delete` }))
		.mutation(async ({ input, ctx }): Promise<{ userKey: string }> => {
			const { userKey } = input
			const { db } = ctx
			const userId = decryptId(userKey)
			ctx.logger.info(`🔑 starting password reset for`, userId)
			const user = await db.drizzle.query.users.findFirst({
				columns: { emailVerified: true, username: true },
				where: eq(users.id, userId),
			})
			if (!user) {
				ctx.logger.error(`🔑 no user with userId:`, userId)
				return { userKey }
			}
			const { emailVerified, username } = user
			if (!emailVerified) {
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `Please verify your email address before resetting your password.`,
				})
			}
			const currentAccountAction =
				await ctx.db.drizzle.query.accountActions.findFirst({
					columns: { action: true, expiresAtIso: true },
					where: eq(accountActions.userId, userId),
				})

			if (currentAccountAction?.action === `cooldown`) {
				const cooldownRemaining = ctx.now.until(
					currentAccountAction.expiresAtIso,
				).milliseconds
				throw new TRPCError({
					code: `TOO_MANY_REQUESTS`,
					message: `You must wait ${simpleFormatMs(cooldownRemaining)} before attempting to perform this action again.`,
				})
			}

			void initiateAccountAction({
				email: emailVerified,
				username,
				userId,
				action: `resetPassword`,
				ctx,
			})

			return { userKey }
		}),

	setPassword: userSessionProcedure
		.input(type({ password: `string` }))
		.mutation(async ({ input, ctx }): Promise<{ password: true }> => {
			const { userId, db } = ctx
			ctx.logger.info(`🔑 setting password for`, userId)

			const user = await db.drizzle.query.users.findFirst({
				columns: { password: true },
				where: eq(users.id, userId),
			})

			if (!user) {
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `User not found.`,
				})
			}

			if (user.password) {
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `Reset your password before setting a new one.`,
				})
			}

			const password = await Bun.password.hash(input.password, {
				algorithm: `bcrypt`,
				cost: 10,
			})

			await ctx.db.drizzle
				.update(users)
				.set({ password })
				.where(eq(users.id, userId))

			return { password: true }
		}),

	isUsernameTaken: loggedProcedure
		.input(type({ username: usernameType }))
		.query(async ({ input, ctx }): Promise<boolean> => {
			const { username } = input
			const maybeUser = await ctx.db.drizzle.query.users.findFirst({
				columns: { id: true },
				where: eq(users.username, username),
			})
			return Boolean(maybeUser)
		}),

	declareAuthTarget: loggedProcedure
		.input(type({ email: `string`, "+": `delete` }))
		.query(async ({ input, ctx }): Promise<AuthTriageResponse> => {
			const { email } = input
			ctx.logger.info(`🔑 authStage1:`, email)
			const maybeVerifiedUser = await ctx.db.drizzle.query.users.findFirst({
				columns: { id: true, password: true, username: true },
				where: eq(users.emailVerified, email),
			})
			if (!maybeVerifiedUser) {
				ctx.logger.info(`🔑 no verified account with email:`, email)
				const maybeUnverifiedUser = await ctx.db.drizzle.query.users.findFirst({
					columns: { id: true, username: true },
					where: and(eq(users.emailOffered, email), isNull(users.emailVerified)),
				})
				if (!maybeUnverifiedUser) {
					ctx.logger.info(`🔑 no account with email:`, email)
					const [newUser] = await ctx.db.drizzle
						.insert(users)
						.values({
							emailOffered: email,
							password: null,
							createdIp: ctx.ip,
							username: Math.random().toString(36).slice(2) as Username,
						})
						.returning()
					ctx.logger.info(`🔑 user created:`, email)
					const newUserKey = encryptId(newUser.id)
					await initiateAccountAction({
						email,
						username: newUser.username,
						userId: newUser.id,
						action: `confirmEmail`,
						ctx,
					})
					return {
						nextStep: `otc_verify`,
						userKey: newUserKey,
					}
				}
				const unverifiedUser = maybeUnverifiedUser
				const unverifiedUserKey = encryptId(unverifiedUser.id)
				await initiateAccountAction({
					email,
					username: unverifiedUser.username,
					userId: unverifiedUser.id,
					action: `confirmEmail`,
					ctx,
				})

				return {
					nextStep: `otc_verify`,
					userKey: unverifiedUserKey,
				}
			}
			const verifiedUser = maybeVerifiedUser
			const verifiedUserKey = encryptId(verifiedUser.id)
			const { password } = verifiedUser
			if (!password) {
				ctx.logger.info(
					`🔑 account with email:`,
					email,
					`is verified but has no password`,
				)
				await initiateAccountAction({
					email,
					username: verifiedUser.username,
					userId: verifiedUser.id,
					action: `signIn`,
					ctx,
				})
				return {
					nextStep: `otc_login`,
					userKey: verifiedUserKey,
				}
			}
			return {
				nextStep: `password_login`,
				userKey: verifiedUserKey,
			}
		}),
})

async function initiateAccountAction(arg: {
	email: string
	username: string
	userId: string
	action: AccountActionTypeActual
	ctx: Context
}): Promise<void> {
	const { email, username, userId, action, ctx } = arg
	const maybeExistingAccountAction =
		await ctx.db.drizzle.query.accountActions.findFirst({
			columns: { action: true, expiresAtIso: true },
			where: eq(accountActions.userId, userId),
		})
	let existingActionMayBeOverwritten = false
	if (maybeExistingAccountAction) {
		const { action: existingAction, expiresAtIso } = maybeExistingAccountAction
		const existingActionIsExpired =
			Temporal.Instant.compare(expiresAtIso, ctx.now) < 0
		if (existingActionIsExpired) {
			existingActionMayBeOverwritten = true
		} else if (existingAction !== `cooldown`) {
			const actionFlow = `${existingAction} -> ${action}` as const
			switch (actionFlow) {
				case `confirmEmail -> resetPassword`:
				case `confirmEmail -> signIn`:
				case `resetPassword -> confirmEmail`:
				case `resetPassword -> signIn`:
				case `signIn -> resetPassword`:
				case `signIn -> confirmEmail`:
					existingActionMayBeOverwritten = true
					break
				case `confirmEmail -> confirmEmail`:
				case `resetPassword -> resetPassword`:
				case `signIn -> signIn`:
					existingActionMayBeOverwritten = false
			}
		}
	}
	if (!maybeExistingAccountAction || existingActionMayBeOverwritten) {
		const accountActionCode = genAccountActionCode()
		const encryptedCode = await Bun.password.hash(accountActionCode, {
			algorithm: `bcrypt`,
			cost: 10,
		})

		ctx.logger.info(`🔑 account action code:`, accountActionCode)

		const expiresAtIso = iso8601(ctx.now.add({ minutes: 15 }))
		await ctx.db.drizzle
			.insert(accountActions)
			.values({
				userId,
				code: encryptedCode,
				action,
				expiresAtIso,
			})
			.onConflictDoUpdate({
				target: [accountActions.userId],
				set: {
					code: encryptedCode,
					action,
					expiresAtIso,
				},
			})

		void sendEmailToConfirmAccountAction({
			to: email,
			username,
			action,
			oneTimeCode: accountActionCode,
			baseUrl: env.FRONTEND_ORIGINS[0],
		})
	}
}
