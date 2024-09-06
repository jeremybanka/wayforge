#!/usr/bin/env node

import { homedir } from "node:os"
import * as path from "node:path"

import { cli, encapsulate, optional, parseBooleanOption } from "comline"
import { FlightDeck } from "flightdeck"
import logger from "npmlog"
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
			tagPattern: z.string().optional(),
			testPattern: z.string(),
			testCommand: z.string(),
			certifyCommand: z.string(),
			verbose: z.boolean().optional(),
		}),
		options: {
			tagPattern: {
				flag: `v`,
				required: false,
				description: `String which, if found in a git tag, will be considered a release tag for your library.`,
				example: `--tagPattern=\"my-library\"`,
			},
			testPattern: {
				flag: `p`,
				required: true,
				description: `The pattern to match test files that test the public API of the library.`,
				example: `--pattern=\"*__public.test.ts\"`,
			},
			testCommand: {
				flag: `t`,
				required: true,
				description: `Complete bash command that runs the tests for the library's public API.`,
				example: `--testCommand=\"npm run test\"`,
			},
			certifyCommand: {
				flag: `c`,
				required: true,
				description: `Complete bash command that determines whether a major version bump for your package is indicated in the workspace. Exit code 0 indicates that a major version bump is indicated, and exit code 1 indicates that no major version bump is indicated.`,
				example: `--certifyCommand=\tsx scripts/certify-major-version-bump.node`,
			},
			verbose: {
				flag: `v`,
				required: false,
				description: `Prints out more information about the process.`,
				example: `--verbose`,
				parse: parseBooleanOption,
			},
		},
	},
	logger,
)
const { positionalArgs, suppliedOptions, writeJsonSchema } = parse(process.argv)

const flightDeck = new FlightDeck(
	`secret`,
	`sample/repo`,
	`my-app`,
	[`./app`],
	path.resolve(homedir(), `services`, `sample/repo`, `my-app`, `current`),
)
