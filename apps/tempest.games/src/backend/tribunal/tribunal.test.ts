import { resolve } from "node:path"

import { OpenAiSafeGenerator } from "safegen/openai"

import { DatabaseManager } from "../../database/tempest-db-manager"
import { banishedIps } from "../../database/tempest-db-schema"
import { env } from "../../library/env"
import { tribunal } from "./tribunal"

const gpt4Gen = new OpenAiSafeGenerator({
	usdBudget: 0.00_15,
	usdMinimum: 0,
	model: `gpt-4o-mini`,
	// biome-ignore lint/style/noNonNullAssertion: We'll handle this on the following lines
	apiKey: env.OPENAI_API_KEY!,
})
if (env.OPENAI_API_KEY === undefined && !(`VITEST` in import.meta.env)) {
	throw new Error(`OPENAI_API_KEY is not set and vitest is not running.`)
}

afterAll(async () => {
	const db = new DatabaseManager()
	await db.drizzle.delete(banishedIps)
	gpt4Gen.squirrel.flush()
})

describe(`tribunal`, () => {
	test(`tribunal`, async () => {
		await tribunal({
			generator: gpt4Gen,
			logFilePath: resolve(import.meta.dirname, `sample.log`),
			logger: console,
		})
	}, 40_000)
})
