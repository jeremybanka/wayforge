import { TRPCError } from "@trpc/server"

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

export const authedProcedure = loggedProcedure.use(async (opts) => {
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
