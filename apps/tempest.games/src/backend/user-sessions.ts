import { CronJob } from "cron"

import { logger } from "./logger"

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7

declare global {
	var __userSessionMap: Map<string, Map<string, number>>
}

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
		process.on(`exit`, async () => {
			await autoExpiry.stop()
			logger.info(`🛬 autoExpiry stopped`)
		})
	}
	return __userSessionMap
})()

export function createSession(username: string, now: Date): string {
	const sessionKey = crypto.randomUUID()
	let userSessions = userSessionMap.get(username)
	if (!userSessions) {
		userSessions = new Map()
		userSessionMap.set(username, userSessions)
	}
	userSessions.set(sessionKey, +now)
	return sessionKey
}
