import { TRPCError } from "@trpc/server"
import { and, eq, gt } from "drizzle-orm"

import {
	banishedIps,
	loginHistory,
	users,
} from "../../database/tempest-db-schema"
import { credentialsType } from "../../library/data-constraints"
import { logger } from "../logger"
import { trpc } from "../router"
import { userSessionMap } from "../user-session-map"

export const login = trpc.procedure
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
			const allUsers = await ctx.db.drizzle.query.users.findMany({
				columns: { id: true, username: true },
			})
			logger.info({ attemptsRemaining, allUsers })
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
	})
