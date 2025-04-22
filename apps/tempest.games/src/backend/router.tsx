import type { RequestListener } from "node:http"

import { initTRPC, TRPCError } from "@trpc/server"
import { type } from "arktype"
import { and, eq, gt } from "drizzle-orm"

import { CompleteAccountAction } from "../../emails/CompleteAccountAction"
import type { DatabaseManager } from "../database/tempest-db-manager"
import type {
	AccountAction,
	AccountActionUpdate,
} from "../database/tempest-db-schema"
import {
	accountActions,
	banishedIps,
	loginHistory,
	users,
} from "../database/tempest-db-schema"
import { credentialsType, signUpType } from "../library/data-constraints"
import { env } from "../library/env"
import { genAccountActionToken as genAccountActionCode } from "./account-actions"
import { resend } from "./email"
import type { logger } from "./logger"
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

interface LoginResponse {
	username: string
	password: boolean
	sessionKey: string
	verification: `unverified` | `verified`
}

interface VerifyAccountActionResponse extends LoginResponse {
	action: Exclude<AccountAction[`action`], `cooldown`>
}

export const trpc = initTRPC.context<Context>().create()

export type AppRouter = typeof appRouter
export const appRouter = trpc.router({
	signUp: trpc.procedure.input(signUpType).mutation(async ({ input, ctx }) => {
		const { username, password, email } = input
		ctx.logger.info(`🔑 attempting to sign up:`, username)
		const maybeUser = await ctx.db.drizzle.query.users.findFirst({
			columns: { id: true },
			where: eq(users.emailVerified, email),
		})
		if (maybeUser) {
			throw new TRPCError({
				code: `BAD_REQUEST`,
				message: `This email was already verified on another account.`,
			})
		}
		const passwordHash = await Bun.password.hash(password, {
			algorithm: `bcrypt`,
			cost: 10,
		})
		const [user] = await ctx.db.drizzle
			.insert(users)
			.values({
				username,
				emailOffered: email,
				password: passwordHash,
				createdIp: ctx.ip,
			})
			.returning()
		ctx.logger.info(`🔑 user created:`, username)
		const accountActionCode = genAccountActionCode()
		const encryptedCode = await Bun.password.hash(accountActionCode, {
			algorithm: `bcrypt`,
			cost: 10,
		})

		await ctx.db.drizzle.insert(accountActions).values({
			action: `confirmEmail`,
			userId: user.id,
			code: encryptedCode,
			expiresAt: new Date(+ctx.now + 1000 * 60 * 15),
		})

		await resend.emails.send({
			from: `Tempest Games <noreply@tempest.games>`,
			to: email,
			subject: `Confirm your email address`,
			react: (
				<CompleteAccountAction
					action="confirmEmail"
					validationCode={accountActionCode}
					baseUrl={env.FRONTEND_ORIGINS[0]}
				/>
			),
		})
	}),

	login: trpc.procedure
		.input(credentialsType)
		.mutation(async ({ input, ctx }): Promise<LoginResponse> => {
			const { username, password } = input
			let successful = false
			let userId: string | null = null
			try {
				ctx.logger.info(`🔑 login attempt as user`, username)
				const tenMinutesAgo = new Date(+ctx.now - 1000 * 60 * 10)
				const recentFailures = await ctx.db.drizzle.query.loginHistory.findMany({
					columns: { userId: true, successful: true, loginTime: true },
					where: and(
						eq(loginHistory.ipAddress, ctx.ip),
						eq(loginHistory.successful, false),
						gt(loginHistory.loginTime, tenMinutesAgo),
					),
					limit: 10,
				})
				const attemptsRemaining = 10 - recentFailures.length
				if (attemptsRemaining < 1) {
					await ctx.db.drizzle.insert(banishedIps).values({
						ip: ctx.ip,
						reason: `Too many recent login attempts.`,
						banishedAt: ctx.now,
						banishedUntil: new Date(+ctx.now + 1000 * 60 * 60 * 24),
					})
					throw new TRPCError({
						code: `TOO_MANY_REQUESTS`,
						message: `Too many recent login attempts.`,
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
				ctx.logger.info(`🔑 login successful as`, username)
				return {
					username,
					password: Boolean(user.password),
					sessionKey,
					verification: user.emailVerified
						? (`verified` as const)
						: (`unverified` as const),
				}
			} finally {
				await ctx.db.drizzle.insert(loginHistory).values({
					userId,
					successful,
					ipAddress: ctx.ip,
					userAgent: ctx.req.headers[`user-agent`] ?? `Withheld`,
					loginTime: ctx.now,
				})
				ctx.logger.info(`🔑 recorded login attempt from`, ctx.ip)
			}
		}),

	verifyAccountAction: trpc.procedure
		.input(type({ token: `string`, username: `string` }))
		.mutation(async ({ input, ctx }): Promise<VerifyAccountActionResponse> => {
			const { token, username } = input
			ctx.logger.info(`🔑 verifying account action token:`, token)

			const user = await ctx.db.drizzle.query.users.findFirst({
				columns: {
					id: true,
					emailOffered: true,
					emailVerified: true,
					password: true,
				},
				where: eq(users.username, username),
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

			const tokenIsCorrect = await Bun.password.verify(token, accountAction.code)

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

			let password = Boolean(user.password)
			let verification = user.emailVerified
				? (`verified` as const)
				: (`unverified` as const)
			switch (action) {
				case `login`: {
					break
				}
				case `confirmEmail`: {
					await ctx.db.drizzle
						.update(users)
						.set({ emailVerified: user.emailOffered })
						.where(eq(users.id, user.id))
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
			const sessionKey = createSession(username, ctx.now)
			return {
				username,
				password,
				sessionKey,
				verification,
				action,
			}
		}),

	startPasswordReset: trpc.procedure
		.input(type({ sessionKey: `string`, username: `string` }))
		.mutation(async ({ input, ctx }): Promise<LoginResponse> => {
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
			if (!user.emailVerified) {
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
				to: user.emailVerified,
				subject: `Reset your password`,
				react: (
					<CompleteAccountAction
						action="resetPassword"
						validationCode={passwordResetCode}
						baseUrl={env.FRONTEND_ORIGINS[0]}
					/>
				),
			})

			return {
				username,
				password: false,
				sessionKey,
				verification: `verified`,
			}
		}),
})
