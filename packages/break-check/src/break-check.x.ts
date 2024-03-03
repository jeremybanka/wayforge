#!/usr/bin/env node

import { breakCheck } from "break-check"
import logger from "npmlog"

import { type CommandLineArg, cli } from "./cli"

const ARGS = {
	tagPattern: {
		shorthand: `p`,
		required: false,
		description: `String which, if found in a git tag, will be considered a release tag for your library.`,
		example: `--tagPattern=\"my-library\"`,
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
