#!/usr/bin/env node

import * as path from "node:path"

import { breakCheck } from "break-check"
import { cli, encapsulate, optional, parseBooleanOption } from "comline"
import logger from "npmlog"
import { z } from "zod"

const parse = cli(
	{
		cliName: `break-check`,
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

if (positionalArgs.length === 0) {
	const { returnValue } = await encapsulate(() => breakCheck(suppliedOptions), {
		console: true,
		stdout: true,
	})
	process.stdout.write(JSON.stringify(returnValue))
	if (`breakingChangesFound` in returnValue) {
		if (returnValue.breakingChangesFound) {
			if (returnValue.breakingChangesCertified) {
				process.exit(0)
			} else {
				process.exit(1)
			}
		} else {
			process.exit(0)
		}
	} else {
		process.exit(2)
	}
} else if (positionalArgs[0] === `schema`) {
	writeJsonSchema(`break-check.schema.json`)
}
