import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"

import { users } from "../database/tempest-db-schema"
import type { ContextAuth } from "./trpc-server"
import { trpc } from "./trpc-server"
import { userSessions } from "./user-sessions"

export const loggedProcedure = trpc.procedure.use(async (opts) => {
	const start = performance.now()

	const result = await opts.next()

	const durationMs = (performance.now() - start).toFixed(0)

	result.ok
		? opts.ctx.logger.info(`😃`, opts.path, `[${opts.type}]`, `${durationMs}ms`)
		: opts.ctx.logger.error(`😭`, opts.path, `[${opts.type}]`, `${durationMs}ms`)

	return result
})

export const userSessionProcedure = loggedProcedure.use((opts) => {
	const { authorization } = opts.ctx.req.headers
	let auth: ContextAuth | null = null
	if (authorization) {
		const [userId, sessionKey] = authorization.split(` `)
		if (userId && sessionKey && userSessions.has(userId, sessionKey)) {
			auth = { userId, sessionKey }
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
		userSessions.delete(opts.ctx.sessionKey)
		throw new TRPCError({
			code: `FORBIDDEN`,
			message: `You must be logged in to perform this action.`,
		})
	}
	if (!user.emailVerified) {
		throw new TRPCError({
			code: `FORBIDDEN`,
			message: `You must be logged in to perform this action.`,
		})
	}
	return opts.next({ ctx: { user } })
})
