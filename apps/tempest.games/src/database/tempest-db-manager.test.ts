/* eslint-disable no-console */
import { createHash } from "node:crypto"

import { eq } from "drizzle-orm"

import { DatabaseManager } from "./tempest-db-manager"
import { games } from "./tempest-db-schema"

function asUUID(input: string): string {
	const hash = createHash(`sha256`).update(input).digest(`hex`)
	const uuid = `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`
	return uuid
}

beforeEach(() => {
	vitest.spyOn(console, `error`)
	vitest.spyOn(console, `warn`)
	vitest.spyOn(console, `info`)
})

describe(`database notifications`, () => {
	test(`updating rows notifies subscribers`, async () => {
		const db = new DatabaseManager()
		await db.setupTriggersAndNotifications()

		const game1Id = asUUID(`game_1`)

		db.observe(`games("${game1Id}")`, () => {
			console.log(`Received notification`)
		})

		await db.drizzle.insert(games).values({ id: asUUID(`game_1`) })

		await db.drizzle.delete(games).where(eq(games.id, asUUID(`game_1`)))
	})
})
