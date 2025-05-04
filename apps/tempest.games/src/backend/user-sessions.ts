import { CronJob } from "cron"

import { logger } from "./logger"
import { Junction } from "atom.io/internal"

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7

declare global {
	var __sessionData: SessionData
}

export type UserSessions = Junction<`user`, string, `session`, string>
export type SessionData = [
	sessionCreatedTimes: Map<string, number>,
	userSessions: UserSessions,
]
export const [sessionCreatedTimes, userSessions]: SessionData = (() => {
	let { __sessionData } = global
	if (!__sessionData) {
		__sessionData = global.__sessionData = [
			new Map(),
			new Junction({
				between: [`user`, `session`],
				cardinality: `1:n`,
			}),
		]
		const [sessionCreatedTimes, userSessions] = __sessionData
		const autoExpiry = new CronJob(`00 00 03 * * *`, () => {
			const now = Date.now()
			for (const [
				sessionId,
				sessionCreatedAt,
			] of sessionCreatedTimes.entries()) {
				if (now - sessionCreatedAt > ONE_WEEK_MS) {
					userSessions.delete(sessionId)
				}
			}
		})
		autoExpiry.start()
		process.on(`exit`, async () => {
			await autoExpiry.stop()
			logger.info(`🛬 autoExpiry stopped`)
		})
	}
	return __sessionData
})()

export function createSession(userId: string, now: Date): string {
	const sessionKey = crypto.randomUUID()
	sessionCreatedTimes.set(sessionKey, +now)
	userSessions.set(userId, sessionKey)
	return sessionKey
}
