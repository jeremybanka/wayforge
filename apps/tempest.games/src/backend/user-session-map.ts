import { CronJob } from "cron"

import { logger } from "."

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7

export const userSessionMap: Map<string, Map<string, number>> = (() => {
	let { __userSessionMap } = globalThis as any
	if (!__userSessionMap) {
		__userSessionMap = globalThis.__userSessionMap = new Map()
		const autoExpiry = new CronJob(`00 00 03 * * *`, () => {
			for (const [userId, sessions] of __userSessionMap.entries()) {
				const now = Date.now()
				for (const [sessionId, sessionCreatedAt] of sessions.entries()) {
					if (now - sessionCreatedAt > ONE_WEEK_MS) {
						sessions.delete(sessionId)
					}
				}
				if (sessions.size === 0) {
					__userSessionMap.delete(userId)
				}
			}
		})
		autoExpiry.start()
		process.on(`exit`, () => {
			autoExpiry.stop()
			logger.info(`🛬 autoExpiry stopped`)
		})
	}
	return __userSessionMap
})()
