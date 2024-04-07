#!/usr/bin/env node

import path from "node:path"
import { breakCheck } from "break-check"
import { cli, OPTIONAL } from "comline"
import logger from "npmlog"
import { z } from "zod"

const parse = cli(
	{
		cliName: `break-check`,
		positionalArgTree: [OPTIONAL, { schema: null, $configPath: null }],
		discoverConfigPath: (args) => {
			if (args[0] === undefined || args[0] === `schema`) {
				return
			}
			const configPath = args[0] ?? process.cwd()
			return path.join(configPath, `break-check.json`)
		},
		optionsSchema: z.object({
			tagPattern: z.string().optional(),
			testPattern: z.string(),
			testCommand: z.string(),
			certifyCommand: z.string(),
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
		},
	},
	logger,
)
const { positionalArgs, suppliedOptions, writeJsonSchema } = parse(process.argv)

if (positionalArgs.length === 0) {
	await breakCheck(suppliedOptions)
} else if (positionalArgs[0] === `schema`) {
	writeJsonSchema(`break-check.schema.json`)
}
