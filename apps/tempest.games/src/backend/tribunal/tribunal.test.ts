import { resolve } from "node:path"

import { OpenAiSafeGenerator } from "safegen/openai"

import { DatabaseManager } from "../../database/tempest-db-manager"
import { banishedIps } from "../../database/tempest-db-schema"
import { env } from "../../library/env"
import { tribunal } from "./tribunal"

const logger = console

const gpt4Gen = new OpenAiSafeGenerator({
	usdBudget: 0.00_15,
	usdMinimum: 0,
	model: `gpt-4o-mini`,
	// biome-ignore lint/style/noNonNullAssertion: We'll handle this on the following lines
	apiKey: env.API_KEY_OPENAI!,
	cachingMode: env.CI ? `read` : `read-write`,
	logger,
})
if (env.API_KEY_OPENAI === undefined && !(`VITEST` in import.meta.env)) {
	throw new Error(`OPENAI_API_KEY is not set and vitest is not running.`)
}

afterAll(async () => {
	const db = new DatabaseManager({
		logQuery(query, params) {
			logger.info(`📝 query`, query, params)
		},
	})
	await db.drizzle.delete(banishedIps)
})

describe(`tribunal`, () => {
	test(`tribunal`, async () => {
		await tribunal({
			generator: gpt4Gen,
			logFilePath: resolve(import.meta.dirname, `sample.log`),
			logger,
			now: new Date(`2024-10-16T20:39:52.496Z`),
		})
	}, 40_000)
})
