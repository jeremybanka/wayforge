#!/usr/bin/env node

import * as path from "node:path"

import type { OptionsGroup } from "comline"
import { cli, optional, parseBooleanOption, parseNumberOption } from "comline"
import { z } from "zod"

import type { FlightDeckOptions } from "./flightdeck.lib"
import { FlightDeck, FlightDeckLogger } from "./flightdeck.lib"

const CLI_LOGGER = new FlightDeckLogger(`comline`, process.pid, undefined, {
	jsonLogging: true,
})
Object.assign(console, {
	log: CLI_LOGGER.info.bind(CLI_LOGGER),
	info: CLI_LOGGER.info.bind(CLI_LOGGER),
	warn: CLI_LOGGER.warn.bind(CLI_LOGGER),
	error: CLI_LOGGER.error.bind(CLI_LOGGER),
})

const FLIGHTDECK_MANUAL = {
	optionsSchema: z.object({
		port: z.number().optional(),
		packageName: z.string(),
		services: z.record(z.object({ run: z.string(), waitFor: z.boolean() })),
		flightdeckRootDir: z.string(),
		scripts: z.object({
			download: z.string(),
			install: z.string(),
			checkAvailability: z.string(),
		}),
		jsonLogging: z.boolean().optional(),
	}),
	options: {
		port: {
			flag: `p`,
			required: false,
			description: `Port to run the flightdeck server on.`,
			example: `--port=8080`,
			parse: parseNumberOption,
		},
		packageName: {
			flag: `n`,
			required: true,
			description: `Name of the package.`,
			example: `--packageName=\"my-app\"`,
		},
		services: {
			flag: `s`,
			required: true,
			description: `Map of service names to executables.`,
			example: `--services="{\\"frontend\\":{\\"run\\":\\"./frontend\\",\\"waitFor\\":false},\\"backend\\":{\\"run\\":\\"./backend\\",\\"waitFor\\":true}}"`,
			parse: JSON.parse,
		},
		flightdeckRootDir: {
			flag: `d`,
			required: true,
			description: `Directory where the service is stored.`,
			example: `--flightdeckRootDir=\"./services/sample/repo/my-app/current\"`,
		},
		scripts: {
			flag: `r`,
			required: true,
			description: `Map of scripts to run.`,
			example: `--scripts="{\\"download\\":\\"npm i",\\"install\\":\\"npm run build\\"}"`,
			parse: JSON.parse,
		},
		jsonLogging: {
			flag: `j`,
			required: false,
			description: `Enable json logging.`,
			example: `--jsonLogging`,
			parse: parseBooleanOption,
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
		debugOutput: true,
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
			await flightDeck.stopAllServices()
		})
	}
}
