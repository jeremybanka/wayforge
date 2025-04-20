import type { RequestListener } from "node:http"

import { initTRPC, TRPCError } from "@trpc/server"
import { type } from "arktype"
import { and, eq, gt } from "drizzle-orm"

import { CompleteAccountAction } from "../../emails/CompleteAccountAction"
import type { DatabaseManager } from "../database/tempest-db-manager"
import {
	accountActions,
	banishedIps,
	loginHistory,
	users,
} from "../database/tempest-db-schema"
import { credentialsType, signUpType } from "../library/data-constraints"
import { env } from "../library/env"
import { genAccountActionToken } from "./account-actions"
import { resend } from "./email"
import { logger } from "./logger"
import { userSessionMap } from "./user-sessions"

interface Context {
	req: Parameters<RequestListener>[0]
	res: Parameters<RequestListener>[1]
	ip: string
	now: Date
	db: DatabaseManager
	logger: typeof logger
}

export const trpc = initTRPC.context<Context>().create()

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
		const accountActionToken = genAccountActionToken()

		await ctx.db.drizzle.insert(accountActions).values({
			action: `emailConfirm`,
			userId: user.id,
			token: accountActionToken,
			expiresAt: new Date(+ctx.now + 1000 * 60 * 15),
		})

		await resend.emails.send({
			from: `noreply@tempest.games`,
			to: email,
			subject: `Confirm your email address`,
			react: (
				<CompleteAccountAction
					action="emailConfirm"
					validationCode={accountActionToken}
					baseUrl={env.FRONTEND_ORIGINS[0]}
				/>
			),
		})

		return { status: 201 }
	}),

	login: trpc.procedure
		.input(credentialsType)
		.mutation(async ({ input, ctx }) => {
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
					// ban IP
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
				const maybeUser = await ctx.db.drizzle.query.users.findFirst({
					columns: { id: true, password: true, emailVerified: true },
					where: eq(users.username, username),
				})
				if (!maybeUser) {
					throw new TRPCError({
						code: `BAD_REQUEST`,
						message: `${attemptsRemaining} attempts remaining.`,
					})
				}
				userId = maybeUser.id
				logger.info({
					password,
					maybeUser,
				})
				const match = await Bun.password.verify(password, maybeUser.password)
				if (!match) {
					throw new TRPCError({
						code: `BAD_REQUEST`,
						message: `${attemptsRemaining} attempts remaining.`,
					})
				}
				const sessionKey = crypto.randomUUID()
				let userSessions = userSessionMap.get(username)
				if (!userSessions) {
					userSessions = new Map()
					userSessionMap.set(username, userSessions)
				}
				const now = new Date()
				userSessions.set(sessionKey, +now)
				successful = true
				ctx.logger.info(`🔑 login successful as`, username)
				return {
					status: 200,
					username,
					sessionKey,
					verification: maybeUser.emailVerified
						? (`verified` as const)
						: (`unverified` as const),
				}
			} finally {
				logger.info(`finally`)
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
		.mutation(async ({ input, ctx }) => {
			const { token, username } = input
			ctx.logger.info(`🔑 verifying account action token:`, token)

			const maybeUser = await ctx.db.drizzle.query.users.findFirst({
				columns: { id: true, emailOffered: true },
				where: eq(users.username, username),
			})

			if (!maybeUser) {
				throw new TRPCError({
					code: `BAD_REQUEST`,
					message: `User not found.`,
				})
			}

			const accountAction = await ctx.db.drizzle.query.accountActions.findFirst({
				columns: { action: true, expiresAt: true, wrongTokenCount: true },
				where: eq(accountActions.userId, maybeUser.id),
			})
		}),
})

export type AppRouter = typeof appRouter
