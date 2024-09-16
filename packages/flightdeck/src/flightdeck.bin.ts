#!/usr/bin/env node

import * as path from "node:path"

import type { OptionsGroup } from "comline"
import { cli, optional, parseArrayOption } from "comline"
import { z } from "zod"

import type { FlightDeckOptions } from "~/packages/flightdeck/src/flightdeck.lib"
import { FlightDeck } from "~/packages/flightdeck/src/flightdeck.lib"

const FLIGHTDECK_MANUAL = {
	optionsSchema: z.object({
		secret: z.string(),
		packageName: z.string(),
		executables: z.record(z.array(z.string())),
		flightDeckRootDir: z.string(),
		downloadPackageToUpdatesCmd: z.array(z.string()),
	}),
	options: {
		secret: {
			flag: `s`,
			required: true,
			description: `Secret used to authenticate with the service.`,
			example: `--secret=\"secret\"`,
		},
		packageName: {
			flag: `p`,
			required: true,
			description: `Name of the package.`,
			example: `--packageName=\"my-app\"`,
		},
		executables: {
			flag: `e`,
			required: true,
			description: `Map of service names to executables.`,
			example: `--executables="{\\"frontend\\":[\\"./app\\"]}"`,
			parse: JSON.parse,
		},
		flightdeckRootDir: {
			flag: `d`,
			required: true,
			description: `Directory where the service is stored.`,
			example: `--flightdeckRootDir=\"./services/sample/repo/my-app/current\"`,
		},
		downloadPackageToUpdatesCmd: {
			flag: `u`,
			required: true,
			description: `Command to update the service.`,
			example: `--downloadPackageToUpdatesCmd=\"./app\"`,
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
			flightDeck.stopAllServices()
			await flightDeck.dead
		})
	}
}
