#!/usr/bin/env node

import * as path from "node:path"

import type { OptionsGroup } from "comline"
import { cli, optional, parseArrayOption } from "comline"
import type { FlightDeckOptions } from "flightdeck"
import { FlightDeck } from "flightdeck"
import { z } from "zod"

const FLIGHTDECK_MANUAL = {
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

const SCHEMA_MANUAL = {
	optionsSchema: z.object({
		outdir: z.string().optional(),
	}),
	options: {
		outdir: {
			flag: `o`,
			required: false,
			description: `Directory to write the schema to.`,
			example: `--outdir=./dist`,
		},
	},
} satisfies OptionsGroup<{ outdir?: string | undefined }>

const parse = cli(
	{
		cliName: `flightdeck`,
		routes: optional({ schema: null, $configPath: null }),
		routeOptions: {
			"": FLIGHTDECK_MANUAL,
			$configPath: FLIGHTDECK_MANUAL,
			schema: SCHEMA_MANUAL,
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

switch (inputs.case) {
	case `schema`:
		{
			const { outdir } = inputs.opts
			writeJsonSchema(outdir ?? `.`)
		}
		break
	default: {
		const flightDeck = new FlightDeck(inputs.opts)
		process.on(`close`, async () => {
			flightDeck.stopService()
			await flightDeck.dead
		})
	}
}
