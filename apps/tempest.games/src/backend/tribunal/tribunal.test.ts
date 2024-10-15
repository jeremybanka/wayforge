import { resolve } from "node:path"

import { DatabaseManager } from "../../database/tempest-db-manager"
import { banishedIps } from "../../database/tempest-db-schema"
import { tribunal } from "./tribunal"

afterAll(async () => {
	const db = new DatabaseManager()
	await db.drizzle.delete(banishedIps)
})

describe(`tribunal`, () => {
	test(`tribunal`, async () => {
		await tribunal(resolve(import.meta.dirname, `sample.log`), console)
	}, 40_000)
})
