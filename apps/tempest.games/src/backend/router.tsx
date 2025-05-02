import type { RequestListener } from "node:http"
import path from "node:path"

import { initTRPC, TRPCError } from "@trpc/server"
import { type } from "arktype"
import { and, eq, gt, isNull } from "drizzle-orm"

import { CompleteAccountAction } from "../../emails/CompleteAccountAction"
import type { DatabaseManager } from "../database/tempest-db-manager"
import type {
	AccountActionTypeActual,
	AccountActionUpdate,
} from "../database/tempest-db-schema"
import {
	accountActions,
	banishedIps,
	signInHistory,
	users,
} from "../database/tempest-db-schema"
import { credentialsType } from "../library/data-constraints"
import { env } from "../library/env"
import {
	genAccountActionCode,
	prettyPrintAccountAction,
} from "./account-actions"
import { resend } from "./email"
import type { logger } from "./logger"
import { unwrapId, wrapId } from "./secrecy"
import { createSession, userSessionMap } from "./user-sessions"

function simpleFormatMs(ms: number): string {
	const seconds = Math.floor(ms / 1000)
	const minutes = Math.floor(seconds / 60)
	const hours = Math.floor(minutes / 60)
	const days = Math.floor(hours / 24)
	const weeks = Math.floor(days / 7)
	const years = Math.floor(weeks / 52)
	if (years > 0) {
		return `${years} year${years === 1 ? `` : `s`}, `
	}
	if (weeks > 0) {
		return `${weeks} week${weeks === 1 ? `` : `s`}, `
	}
	if (days > 0) {
		return `${days} day${days === 1 ? `` : `s`}, `
	}
	if (hours > 0) {
		return `${hours} hour${hours === 1 ? `` : `s`}, `
	}
	if (minutes > 0) {
		return `${minutes} minute${minutes === 1 ? `` : `s`}, `
	}
	return `${seconds} second${seconds === 1 ? `` : `s`}`
}

interface Context {
	req: Parameters<RequestListener>[0]
	res: Parameters<RequestListener>[1]
	ip: string
	now: Date
	db: DatabaseManager
	logger: typeof logger
}

interface SignInResponse {
	email: string
	username: string
	password: boolean
	sessionKey: string
	verification: `unverified` | `verified`
}

interface VerifyAccountActionResponse extends SignInResponse {
	action: AccountActionTypeActual
}

export const trpc = initTRPC.context<Context>().create()

export type AppRouter = typeof appRouter
export const appRouter = trpc.router({
	version: trpc.procedure.query(async () => {
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

	openSession: trpc.procedure
		.input(credentialsType)
		.mutation(async ({ input, ctx }): Promise<SignInResponse> => {
			const { email: username, password } = input
			let successful = false
			let userId: string | null = null
			try {
				ctx.logger.info(`🔑 sign in attempt as user`, username)
				const tenMinutesAgo = new Date(+ctx.now - 1000 * 60 * 10)
				const recentFailures = await ctx.db.drizzle.query.signInHistory.findMany(
					{
						columns: { userId: true, successful: true, signInTime: true },
						where: and(
							eq(signInHistory.ipAddress, ctx.ip),
							eq(signInHistory.successful, false),
							gt(signInHistory.signInTime, tenMinutesAgo),
						),
						limit: 10,
					},
				)
				const attemptsRemaining = 10 - recentFailures.length
				if (attemptsRemaining < 1) {
					await ctx.db.drizzle.insert(banishedIps).values({
						ip: ctx.ip,
						reason: `Too many recent sign in attempts.`,
						banishedAt: ctx.now,
						banishedUntil: new Date(+ctx.now + 1000 * 60 * 60 * 24),
					})
					throw new TRPCError({
						code: `TOO_MANY_REQUESTS`,
						message: `Too many recent sign in attempts.`,
					})
				}
				const user = await ctx.db.drizzle.query.users.findFirst({
					columns: { id: true, password: true, emailVerified: true },
					where: eq(users.username, username),
				})
				if (!user) {
					throw new TRPCError({
						code: `BAD_REQUEST`,
						message: `${attemptsRemaining} attempts remaining.`,
					})
				}
				if (!user.password) {
					throw new TRPCError({
						code: `BAD_REQUEST`,
						message: `Sign in with a link.`,
					})
				}
				userId = user.id
				const match = await Bun.password.verify(password, user.password)
				if (!match) {
					throw new TRPCError({
						code: `BAD_REQUEST`,
						message: `${attemptsRemaining} attempts remaining.`,
					})
				}
				const sessionKey = createSession(username, ctx.now)
				successful = true
				ctx.logger.info(`🔑 sign in successful as`, username)
				return {
					email: user.emailVerified ?? ``,
					username,
					password: Boolean(user.password),
					sessionKey,
					verification: user.emailVerified
						? (`verified` as const)
						: (`unverified` as const),
				}
			} finally {
				await ctx.db.drizzle.insert(signInHistory).values({
					userId,
					successful,
					ipAddress: ctx.ip,
					userAgent: ctx.req.headers[`user-agent`] ?? `Withheld`,
					signInTime: ctx.now,
				})
				ctx.logger.info(`🔑 recorded sign in attempt from`, ctx.ip)
			}
		}),

	closeSession: trpc.procedure
		.input(type({ username: `string`, sessionKey: `string` }))
		.mutation(({ input }) => {
			const { username, sessionKey } = input
			const sessionMap = userSessionMap.get(username)
			if (!sessionMap) {
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `Session not found.`,
				})
			}
			const sessionKeyIsValid = sessionMap.has(sessionKey)
			if (!sessionKeyIsValid) {
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `Session not found.`,
				})
			}
			sessionMap.delete(sessionKey)
		}),

	verifyAccountAction: trpc.procedure
		.input(type({ oneTimeCode: `string`, userKey: `string`, "+": `delete` }))
		.mutation(async ({ input, ctx }): Promise<VerifyAccountActionResponse> => {
			const { oneTimeCode, userKey } = input
			ctx.logger.info(`🔑 verifying account action token:`, oneTimeCode)

			const userId = unwrapId(userKey)
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
					expiresAt: true,
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
				const cooldownMs = accountAction.expiresAt.getTime() - ctx.now.getTime()
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
						expiresAt: new Date(+ctx.now + 1000 * 60 * 15),
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
			const sessionKey = createSession(username, ctx.now)
			return {
				email,
				username,
				password,
				sessionKey,
				verification,
				action,
			}
		}),

	startPasswordReset: trpc.procedure
		.input(type({ sessionKey: `string`, username: `string` }))
		.mutation(async ({ input, ctx }): Promise<SignInResponse> => {
			const { sessionKey, username } = input
			ctx.logger.info(`🔑 starting password reset for`, username)
			const user = await ctx.db.drizzle.query.users.findFirst({
				columns: { id: true, emailVerified: true },
				where: eq(users.username, username),
			})
			if (!user) {
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `User not found.`,
				})
			}
			const { emailVerified } = user
			if (!emailVerified) {
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `Please verify your email address before resetting your password.`,
				})
			}

			const userSessions = userSessionMap.get(username)

			if (!userSessions) {
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `Session not found.`,
				})
			}
			if (!userSessions.has(sessionKey)) {
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `Session not found.`,
				})
			}
			const currentAccountAction =
				await ctx.db.drizzle.query.accountActions.findFirst({
					columns: { action: true, expiresAt: true },
					where: eq(accountActions.userId, user.id),
				})
			if (currentAccountAction) {
				if (currentAccountAction.action === `cooldown`) {
					throw new TRPCError({
						code: `TOO_MANY_REQUESTS`,
						message: `You must wait ${currentAccountAction.expiresAt.getTime() - ctx.now.getTime()} before attempting to perform this action again.`,
					})
				}
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `Account action (${currentAccountAction.action}) already in progress.`,
				})
			}

			const passwordResetCode = genAccountActionCode()
			const encryptedCode = await Bun.password.hash(passwordResetCode, {
				algorithm: `bcrypt`,
				cost: 10,
			})

			await ctx.db.drizzle.insert(accountActions).values({
				action: `resetPassword`,
				userId: user.id,
				code: encryptedCode,
				expiresAt: new Date(+ctx.now + 1000 * 60 * 15),
			})

			await resend.emails.send({
				from: `Tempest Games <noreply@tempest.games>`,
				to: emailVerified,
				subject: `Reset your password`,
				react: (
					<CompleteAccountAction
						username={username}
						action="resetPassword"
						validationCode={passwordResetCode}
						baseUrl={env.FRONTEND_ORIGINS[0]}
					/>
				),
			})

			return {
				email: emailVerified,
				username,
				password: false,
				sessionKey,
				verification: `verified`,
			}
		}),

	isUsernameTaken: trpc.procedure
		.input(type({ username: `string` }))
		.query(async ({ input, ctx }): Promise<boolean> => {
			const { username } = input
			const maybeUser = await ctx.db.drizzle.query.users.findFirst({
				columns: { id: true },
				where: eq(users.username, username),
			})
			return Boolean(maybeUser)
		}),

	authStage1: trpc.procedure
		.input(type({ email: `string`, "+": `delete` }))
		.query(async ({ input, ctx }): Promise<AuthStage1Response> => {
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
							username: Math.random().toString(36).slice(2),
						})
						.returning()
					ctx.logger.info(`🔑 user created:`, email)
					const newUserKey = wrapId(newUser.id)
					await initiateAccountAction({
						email,
						username: newUser.username,
						userId: newUser.id,
						action: `confirmEmail`,
						ctx,
					})
					return {
						nextStep: `otp_verify`,
						userKey: newUserKey,
					}
				}
				const unverifiedUser = maybeUnverifiedUser
				const unverifiedUserKey = wrapId(unverifiedUser.id)
				await initiateAccountAction({
					email,
					username: unverifiedUser.username,
					userId: unverifiedUser.id,
					action: `confirmEmail`,
					ctx,
				})

				return {
					nextStep: `otp_verify`,
					userKey: unverifiedUserKey,
				}
			}
			const verifiedUser = maybeVerifiedUser
			const verifiedUserKey = wrapId(verifiedUser.id)
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
					nextStep: `otp_login`,
					userKey: verifiedUserKey,
				}
			}
			return {
				nextStep: `password_login`,
				userKey: verifiedUserKey,
			}
		}),
})

export type AuthStage1Response = {
	nextStep: `otp_login` | `otp_verify` | `password_login`
	userKey: string
}

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
			columns: { action: true, expiresAt: true },
			where: eq(accountActions.userId, userId),
		})
	let existingActionMayBeOverwritten = false
	if (maybeExistingAccountAction) {
		const { action: existingAction, expiresAt } = maybeExistingAccountAction
		const existingActionIsExpired = expiresAt.getTime() < ctx.now.getTime()
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
					existingActionMayBeOverwritten = true
					break
				case `confirmEmail -> confirmEmail`:
				case `resetPassword -> resetPassword`:
				case `signIn -> confirmEmail`:
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

		ctx.logger.info({
			encryptedCode,
			accountActionCode,
			doesMatch: await Bun.password.verify(accountActionCode, encryptedCode),
		})

		const expiresAt = new Date(+ctx.now + 1000 * 60 * 15)
		await ctx.db.drizzle
			.insert(accountActions)
			.values({
				userId,
				code: encryptedCode,
				action,
				expiresAt,
			})
			.onConflictDoUpdate({
				target: [accountActions.userId],
				set: {
					code: encryptedCode,
					action,
					expiresAt,
				},
			})

		void resend.emails.send({
			from: `Tempest Games <noreply@tempest.games>`,
			to: email,
			subject: prettyPrintAccountAction(action, username)[0],
			react: (
				<CompleteAccountAction
					username={username}
					action={action}
					validationCode={accountActionCode}
					baseUrl={env.FRONTEND_ORIGINS[0]}
				/>
			),
		})
	}
}
