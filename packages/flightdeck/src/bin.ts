#!/usr/bin/env node

import * as path from "node:path"

import { cli, optional, parseArrayOption } from "comline"
import { FlightDeck } from "flightdeck"
import { z } from "zod"

const parse = cli(
	{
		cliName: `flightdeck`,
		positionalArgTree: optional({ schema: null, $configPath: null }),
		discoverConfigPath: (args) => {
			if (args[0] === `schema`) {
				return
			}
			const configPath =
				args[0] ?? path.join(process.cwd(), `break-check.config.json`)
			return configPath
		},
		optionsSchema: z.object({
			secret: z.string().optional(),
			repo: z.string().optional(),
			app: z.string().optional(),
			runCmd: z.array(z.string()).optional(),
			serviceDir: z.string().optional(),
			updateCmd: z.string().optional(),
		}),
		options: {
			secret: {
				flag: `s`,
				required: false,
				description: `Secret used to authenticate with the service.`,
				example: `--secret=\"secret\"`,
			},
			repo: {
				flag: `r`,
				required: false,
				description: `Name of the repository.`,
				example: `--repo=\"sample/repo\"`,
			},
			app: {
				flag: `a`,
				required: false,
				description: `Name of the application.`,
				example: `--app=\"my-app\"`,
			},
			runCmd: {
				flag: `r`,
				required: false,
				description: `Command to run the application.`,
				example: `--runCmd=\"./app\"`,
				parse: parseArrayOption,
			},
			serviceDir: {
				flag: `d`,
				required: false,
				description: `Directory where the service is stored.`,
				example: `--serviceDir=\"./services/sample/repo/my-app/current\"`,
			},
			updateCmd: {
				flag: `u`,
				required: false,
				description: `Command to update the service.`,
				example: `--updateCmd=\"./app\"`,
			},
		},
	},
	console,
)
const { positionalArgs, suppliedOptions, writeJsonSchema } = parse(process.argv)
const { secret, repo, app, runCmd, serviceDir, updateCmd } = suppliedOptions

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
