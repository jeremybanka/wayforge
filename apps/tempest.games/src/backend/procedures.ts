import { Temporal } from "@js-temporal/polyfill"
import { TRPCError } from "@trpc/server"
import { CookieMap } from "bun"
import { eq } from "drizzle-orm"

import { users, userSessions } from "../database/tempest-db-schema"
import type { ContextAuth } from "./trpc-server"
import { trpc } from "./trpc-server"

export const loggedProcedure = trpc.procedure.use(async (opts) => {
	const start = performance.now()

	const result = await opts.next()

	const durationMs = (performance.now() - start).toFixed(0)

	result.ok
		? opts.ctx.logger.info(`😃`, opts.path, `[${opts.type}]`, `${durationMs}ms`)
		: opts.ctx.logger.error(`😭`, opts.path, `[${opts.type}]`, `${durationMs}ms`)

	return result
})

export const userSessionProcedure = loggedProcedure.use(async (opts) => {
	const cookieHeader = opts.ctx.req.headers.cookie ?? ``
	const cookies = new CookieMap(cookieHeader)
	const sessionKey = cookies.get(`sessionKey`)
	let auth: ContextAuth | null = null
	if (sessionKey) {
		const session = await opts.ctx.db.drizzle.query.userSessions.findFirst({
			columns: { createdAtIso: true, userId: true },
			where: eq(userSessions.sessionKey, sessionKey),
		})
		if (session) {
			const { createdAtIso, userId } = session
			const aboutAWeekAgo = Temporal.Now.instant().subtract({ hours: 24 * 7 })
			const createdAt = Temporal.Instant.from(createdAtIso)
			const isExpired = Temporal.Instant.compare(createdAt, aboutAWeekAgo) <= 0
			if (isExpired) {
				await opts.ctx.db.drizzle
					.delete(userSessions)
					.where(eq(userSessions.sessionKey, sessionKey))
			} else if (userId) {
				auth = { userId, sessionKey }
			}
		}
	}
	if (!auth) {
		throw new TRPCError({
			code: `UNAUTHORIZED`,
			message: `You must be logged in to perform this action.`,
		})
	}
	return opts.next({
		ctx: auth,
	})
})

export const verifiedUserProcedure = userSessionProcedure.use(async (opts) => {
	const user = await opts.ctx.db.drizzle.query.users.findFirst({
		where: eq(users.id, opts.ctx.userId),
	})
	if (!user) {
		throw new TRPCError({
			code: `UNPROCESSABLE_CONTENT`,
			message: `User not found.`,
		})
	}
	if (!user.emailVerified) {
		throw new TRPCError({
			code: `FORBIDDEN`,
			message: `You must verify your email address before performing this action.`,
		})
	}
	return opts.next({ ctx: { user } })
})
