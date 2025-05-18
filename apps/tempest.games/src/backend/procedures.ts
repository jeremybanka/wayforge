import { TRPCError } from "@trpc/server"

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

export const authedProcedure = loggedProcedure.use(async (opts) => {
	if (!opts.ctx.auth) {
		throw new TRPCError({
			code: `UNAUTHORIZED`,
			message: `You must be logged in to perform this action.`,
		})
	}
	return opts.next()
})
