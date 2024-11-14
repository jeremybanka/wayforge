#!/usr/bin/env bun

import { ParentSocket } from "atom.io/realtime-server"
import { OpenAiSafeGenerator } from "safegen/openai"

import { tribunal } from "./backend/tribunal/tribunal"
import { env } from "./library/env"

const parent = new ParentSocket()
Object.assign(console, parent.logger, { log: parent.logger.info })

process.on(`SIGINT`, () => {
	parent.logger.info(`❗ received SIGINT; exiting gracefully`)
	gracefulExit()
})
process.on(`SIGTERM`, () => {
	parent.logger.info(`❗ received SIGTERM; exiting gracefully`)
	gracefulExit()
})
process.on(`exit`, () => {
	parent.logger.info(`❗ received exit; exiting gracefully`)
	gracefulExit()
})

parent.logger.info(`🛫 tribunal worker ready`)

const gpt4Gen = new OpenAiSafeGenerator({
	usdBudget: 0.01,
	usdMinimum: 0,
	model: `gpt-4o-mini`,
	// biome-ignore lint/style/noNonNullAssertion: We'll handle this on the following lines
	apiKey: env.OPENAI_API_KEY!,
	cachingMode: `off`,
	logger: parent.logger,
})
if (env.OPENAI_API_KEY === undefined && !(`VITEST` in import.meta.env)) {
	throw new Error(`OPENAI_API_KEY is not set and vitest is not running.`)
}

await tribunal({
	generator: gpt4Gen,
	logFilePath: `/var/log/nginx/access.log`,
	logger: parent.logger,
})
gracefulExit()

function gracefulExit() {
	parent.logger.info(`🛬 tribunal server exiting`)
	process.exit(0)
}
