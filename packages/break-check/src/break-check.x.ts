#!/usr/bin/env node

import { breakCheck } from "break-check"
import logger from "npmlog"

import { type CommandLineArg, cli } from "./cli"

const ARGS = {
	tagPattern: {
		shorthand: `v`,
		required: false,
		description: `String which, if found in a git tag, will be considered a release tag for your library.`,
		example: `--tagPattern=\"my-library\"`,
	},
	testPattern: {
		shorthand: `p`,
		required: true,
		description: `The pattern to match test files that test the public API of the library.`,
		example: `--pattern=\"*__public.test.ts\"`,
	},
	testCommand: {
		shorthand: `t`,
		required: true,
		description: `Complete bash command that runs the tests for the library's public API.`,
		example: `--testCommand=\"npm run test\"`,
	},
	certifyCommand: {
		shorthand: `c`,
		required: true,
		description: `Complete bash command that determines whether a major version bump for your package is indicated in the workspace. Exit code 0 indicates that a major version bump is indicated, and exit code 1 indicates that no major version bump is indicated.`,
		example: `--certifyCommand=\tsx scripts/certify-major-version-bump.node`,
	},
} satisfies Record<string, CommandLineArg>

const suppliedArgs = cli(ARGS, logger).parse(process.argv)
await breakCheck(suppliedArgs)
