#!/usr/bin/env node

import * as path from "node:path"

import type { OptionsGroup } from "comline"
import { cli, optional, parseArrayOption } from "comline"
import type { FlightDeckOptions } from "flightdeck"
import { FlightDeck } from "flightdeck"
import { z } from "zod"

// const noOptions = {
// 	optionsSchema: z.object({}),
// 	options: {},
// } satisfies OptionsGroup<Record<string, never>>

const optGroup0 = {
	optionsSchema: z.object({
		secret: z.string(),
		repo: z.string(),
		app: z.string(),
		runCmd: z.array(z.string()),
		serviceDir: z.string(),
		updateCmd: z.array(z.string()),
	}),
	options: {
		secret: {
			flag: `s`,
			required: true,
			description: `Secret used to authenticate with the service.`,
			example: `--secret=\"secret\"`,
		},
		repo: {
			flag: `r`,
			required: true,
			description: `Name of the repository.`,
			example: `--repo=\"sample/repo\"`,
		},
		app: {
			flag: `a`,
			required: true,
			description: `Name of the application.`,
			example: `--app=\"my-app\"`,
		},
		runCmd: {
			flag: `r`,
			required: true,
			description: `Command to run the application.`,
			example: `--runCmd=\"./app\"`,
			parse: parseArrayOption,
		},
		serviceDir: {
			flag: `d`,
			required: true,
			description: `Directory where the service is stored.`,
			example: `--serviceDir=\"./services/sample/repo/my-app/current\"`,
		},
		updateCmd: {
			flag: `u`,
			required: true,
			description: `Command to update the service.`,
			example: `--updateCmd=\"./app\"`,
			parse: parseArrayOption,
		},
	},
} satisfies OptionsGroup<FlightDeckOptions>

const parse = cli(
	{
		cliName: `flightdeck`,
		routes: optional({ schema: null, $configPath: null }),
		routeOptions: {
			"": optGroup0,
			$configPath: null,
			schema: null,
		},
		discoverConfigPath: (args) => {
			if (args[0] === `schema`) {
				return
			}
			const configPath =
				args[0] ?? path.join(process.cwd(), `flightdeck.config.json`)
			return configPath
		},
	},
	console,
)
const { inputs, writeJsonSchema } = parse(process.argv)
// const { secret, repo, app, runCmd, serviceDir, updateCmd } = suppliedOptions

switch (inputs.case) {
	case `schema`:
		inputs.opts
		break
	case `$configPath`:
		inputs.path
		break
	default:
		console.log(`🚀 flightdeck`)
		break
}
if (secret === undefined) {
	console.error(`secret is required`)
	process.exit(1)
}
if (repo === undefined) {
	console.error(`repo is required`)
	process.exit(1)
}
if (app === undefined) {
	console.error(`app is required`)
	process.exit(1)
}
if (runCmd === undefined) {
	console.error(`runCmd is required`)
	process.exit(1)
}

const flightDeck = new FlightDeck({
	secret,
	repo,
	app,
	runCmd,
	serviceDir,
})

process.on(`close`, async () => {
	flightDeck.stopService()
	await flightDeck.dead
})
