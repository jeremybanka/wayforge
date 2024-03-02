#!/usr/bin/env node

import logger from "npmlog"

import { breakCheck } from "./break-check"
import { type CommandLineArg, cli } from "./cli"

// Example usage
// node bin/break-check.js --tagPattern="my-library" --testPattern="*__public.test.ts" --testCommand="npm run test"

const ARGS = {
	tagPattern: {
		shorthand: `p`,
		required: true,
		description: `String which, if found in a git tag, will be considered a release tag for your library.`,
		example: `--tagPattern=\"my-lib-v.*\"`,
	},
	testPattern: {
		shorthand: `t`,
		required: true,
		description: `The pattern to match test files that test the public API of the library.`,
		example: `--pattern=\"*__public.test.ts\"`,
	},
	testCommand: {
		shorthand: `c`,
		required: true,
		description: `Complete bash command that runs the tests for the library's public API.`,
		example: `--testCommand=\"npm run test\"`,
	},
} satisfies Record<string, CommandLineArg>

const suppliedArgs = cli(ARGS, logger).parse(process.argv)
breakCheck(suppliedArgs)
