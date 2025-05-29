import type { Temporal } from "@js-temporal/polyfill"
import { Junction } from "atom.io/internal"
import { CronJob } from "cron"

import { logger } from "./logger"

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7
const TEN_MINUTES_MS = 1000 * 60 * 10

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
		const [createdTimes, sessions] = __sessionData
		const autoExpiry = new CronJob(`00 00 03 * * *`, () => {
			const now = Date.now()
			for (const [sessionId, sessionCreatedAt] of createdTimes.entries()) {
				if (now - sessionCreatedAt > ONE_WEEK_MS) {
					sessions.delete(sessionId)
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

export function createSession(userId: string, now: Temporal.Instant): string {
	const sessionKey = crypto.randomUUID()
	sessionCreatedTimes.set(sessionKey, +now)
	userSessions.set(userId, sessionKey)
	return sessionKey
}

export function isSessionRecent(
	sessionKey: string,
	now: Temporal.Instant,
): boolean {
	const sessionCreatedAt = sessionCreatedTimes.get(sessionKey)
	if (!sessionCreatedAt) return false
	return +now - sessionCreatedAt < TEN_MINUTES_MS
}
