import { Temporal } from "@js-temporal/polyfill"
import { CronJob } from "cron"
import { eq } from "drizzle-orm"

import { userSessions } from "../database/tempest-db-schema"
import { db } from "./db"
import { logger } from "./logger"
import { instant, iso8601 } from "./time"
import type { Context } from "./trpc-server"

export const sessionExpiry: CronJob = (() => {
	const autoExpiry = new CronJob(`00 00 03 * * *`, async () => {
		const aboutAWeekAgoInst = Temporal.Now.instant().subtract({ hours: 24 * 7 })
		const aboutAWeekAgo = iso8601(aboutAWeekAgoInst)
		await db.sql`DELETE FROM userSessions WHERE createdAtIso::timestamptz < ${aboutAWeekAgo}::timestamptz`
	})
	autoExpiry.start()
	process.on(`exit`, async () => {
		await autoExpiry.stop()
		logger.info(`🛬 autoExpiry stopped`)
	})
	return autoExpiry
})()

export async function createSession(
	userId: string,
	ctx: Context,
): Promise<string> {
	const [{ sessionKey }] = await ctx.db.drizzle
		.insert(userSessions)
		.values({
			userId,
			sessionKey: crypto.randomUUID(),
			createdAtIso: iso8601(ctx.now),
		})
		.returning()
	return sessionKey
}

export async function isSessionRecent(
	sessionKey: string,
	now: Temporal.Instant,
): Promise<boolean> {
	const session = await db.drizzle.query.userSessions.findFirst({
		where: eq(userSessions.sessionKey, sessionKey),
	})
	if (!session) return false
	const sessionCreatedAt = instant(session.createdAtIso)
	const tenMinutesAgo = now.subtract({ minutes: 10 })
	return Temporal.Instant.compare(sessionCreatedAt, tenMinutesAgo) >= 0
}
