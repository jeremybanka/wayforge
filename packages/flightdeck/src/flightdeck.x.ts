#!/usr/bin/env node

import * as path from "node:path"

import { type } from "arktype"
import type { OptionsGroup } from "comline"
import {
	cli,
	optional,
	options,
	parseBooleanOption,
	parseNumberOption,
} from "comline"

import type { FlightDeckOptions } from "./flightdeck.lib.ts"
import { FlightDeck, FlightDeckLogger } from "./flightdeck.lib.ts"

const CLI_LOGGER = new FlightDeckLogger(`comline`, process.pid, undefined, {
	jsonLogging: true,
})
Object.assign(console, {
	log: CLI_LOGGER.info.bind(CLI_LOGGER),
	info: CLI_LOGGER.info.bind(CLI_LOGGER),
	warn: CLI_LOGGER.warn.bind(CLI_LOGGER),
	error: CLI_LOGGER.error.bind(CLI_LOGGER),
})

const FLIGHTDECK_MANUAL = options(
	`Run the FlightDeck process manager.`,
	type({
		"port?": `number`,
		packageName: `string`,
		services: { "[string]": { run: `string`, waitFor: `boolean` } },
		flightdeckRootDir: `string`,
		scripts: {
			download: `string`,
			install: `string`,
			checkAvailability: `string`,
		},
		"jsonLogging?": `boolean`,
	}),
	{
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
			example: `--packageName="my-app"`,
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
			example: `--flightdeckRootDir="./services/sample/repo/my-app/current"`,
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
) satisfies OptionsGroup<FlightDeckOptions>

const KILL_MANUAL = options(
	`Kill the FlightDeck process.`,
	type({ flightdeckRootDir: `string`, packageName: `string` }),
	{
		flightdeckRootDir: {
			flag: `d`,
			required: true,
			description: `Directory where the service is stored.`,
			example: `--flightdeckRootDir="./services/sample/repo/my-app/current"`,
		},
		packageName: {
			flag: `n`,
			required: true,
			description: `Name of the package.`,
			example: `--packageName="my-app"`,
		},
	},
)

const SCHEMA_MANUAL = options(
	`Write a json schema for the FlightDeck options.`,
	type({ "outdir?": `string` }),
	{
		outdir: {
			flag: `o`,
			required: false,
			description: `Directory to write the schema to.`,
			example: `--outdir=./dist`,
		},
	},
) satisfies OptionsGroup<{ outdir?: string | undefined }>

const parse = cli(
	{
		cliName: `flightdeck`,
		routes: optional({
			schema: null,
			kill: optional({ $configPath: null }),
			$configPath: null,
		}),
		routeOptions: {
			"": FLIGHTDECK_MANUAL,
			$configPath: FLIGHTDECK_MANUAL,
			kill: KILL_MANUAL,
			"kill/$configPath": KILL_MANUAL,
			schema: SCHEMA_MANUAL,
		},
		debugOutput: true,
		discoverConfigPath: (args) => {
			if (args[0] === `schema`) {
				return
			}
			let idx = 0
			if (args[0] === `kill`) {
				idx = 1
			}
			const configPath =
				args[idx] ?? path.join(process.cwd(), `flightdeck.config.json`)
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
	case `kill`:
	case `kill/$configPath`:
		{
			const { flightdeckRootDir, packageName } = inputs.opts
			await FlightDeck.kill(flightdeckRootDir, packageName)
		}
		break
	case ``:
	case `$configPath`: {
		new FlightDeck(inputs.opts)
	}
}
