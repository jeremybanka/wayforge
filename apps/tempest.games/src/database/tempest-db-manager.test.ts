import { eq } from "drizzle-orm"

import { asUUID } from "../library/as-uuid-node"
import { DatabaseManager } from "./tempest-db-manager"
import { games } from "./tempest-db-schema"

beforeEach(() => {
	vitest.spyOn(console, `error`)
	vitest.spyOn(console, `warn`)
	vitest.spyOn(console, `info`)
})

describe(`database notifications`, () => {
	test(`updating rows notifies subscribers`, async () => {
		const db = new DatabaseManager({
			logQuery(query, params) {
				console.info(`📝 query`, query, params)
			},
		})
		await db.setupTriggersAndNotifications()

		const game1Id = asUUID(`game_1`)

		db.observe(`games("${game1Id}")`, () => {
			console.log(`Received notification`)
		})

		await db.drizzle.insert(games).values({ id: asUUID(`game_1`) })

		await db.drizzle.delete(games).where(eq(games.id, asUUID(`game_1`)))
	})
})
