#!/usr/bin/env node

import * as path from "node:path"
import { inspect } from "node:util"

import { type } from "arktype"
import type { OptionsGroup } from "comline"
import {
	cli,
	encapsulate,
	help,
	helpOption,
	optional,
	options,
	parseBooleanOption,
} from "comline"
import logger from "takua"

import type { BreakCheckOptions } from "./break-check"
import { breakCheck } from "./break-check"

const helper = helpOption()

const BREAK_CHECK_MANUAL = options(
	`Check for breaking changes in a package.`,
	type({
		"tagPattern?": `string`,
		testPattern: `string`,
		testCommand: `string`,
		certifyCommand: `string`,
		"baseDirname?": `string`,
		"verbose?": `boolean`,
		"help?": `boolean`,
	}),
	{
		...helper.optionConfigs,
		tagPattern: {
			flag: `v`,
			required: false,
			description: `String which, if found in a git tag, will be considered a release tag for your library.`,
			example: `--tagPattern="my-library"`,
		},
		testPattern: {
			flag: `p`,
			required: true,
			description: `The pattern to match test files that test the public API of the library.`,
			example: `--pattern="*__public.test.ts"`,
		},
		testCommand: {
			flag: `t`,
			required: true,
			description: `Complete bash command that runs the tests for the library's public API.`,
			example: `--testCommand="npm run test"`,
		},
		certifyCommand: {
			flag: `c`,
			required: true,
			description: `Complete bash command that determines whether a major version bump for your package is indicated in the workspace. Exit code 0 indicates that a major version bump is indicated, and exit code 1 indicates that no major version bump is indicated.`,
			example: `--certifyCommand=\tsx scripts/certify-major-version-bump.node`,
		},
		baseDirname: {
			flag: `d`,
			required: false,
			description: `The base directory to run the command from.`,
			example: `--baseDirname=./packages/my-package`,
		},
		verbose: {
			flag: `v`,
			required: false,
			description: `Prints out more information about the process.`,
			example: `--verbose`,
			parse: parseBooleanOption,
		},
	},
) satisfies OptionsGroup<BreakCheckOptions & { help?: boolean | undefined }>

const SCHEMA_MANUAL = options(
	`Create a copy of the schema for configuring break-check.`,
	type({ "outdir?": `string` }),
	{
		outdir: {
			flag: `o`,
			required: false,
			description: `Directory to write the schema to.`,
			example: `--outdir=./dist`,
		},
	},
)

const parse = cli(
	{
		cliName: `break-check`,
		routes: optional({ schema: null, $configPath: null }),
		routeOptions: {
			"": BREAK_CHECK_MANUAL,
			$configPath: BREAK_CHECK_MANUAL,
			schema: SCHEMA_MANUAL,
		},
		discoverConfigPath: (args) => {
			if (args[0] === `schema`) {
				return
			}
			const configPath =
				args[0] ?? path.join(process.cwd(), `break-check.config.json`)
			return configPath
		},
	},
	logger,
)
const { inputs, writeJsonSchema } = parse(process.argv)

switch (inputs.case) {
	case `schema`:
		{
			const { outdir } = inputs.opts
			writeJsonSchema(outdir ?? `.`)
			process.stdout.write(`📝 Wrote json.schema.`)
		}
		break
	case ``:
	case `$configPath`: {
		if (inputs.opts.help) {
			console.log(help(parse.definition))
		}

		const { returnValue } = await encapsulate(() => breakCheck(inputs.opts), {
			console: true,
			stdout: true,
		})
		if (`testResult` in returnValue && returnValue.breakingChangesFound) {
			process.stdout.write(returnValue.testResult)
		}
		if (`breakingChangesFound` in returnValue) {
			if (returnValue.breakingChangesFound) {
				if (returnValue.breakingChangesCertified) {
					process.stdout.write(`👷 Breaking changes were found and certified.`)
					process.exit(0)
				} else {
					process.stdout.write(
						`❌ Breaking changes were found, but not certified.`,
					)
					process.exit(1)
				}
			} else {
				process.stdout.write(`✅ No breaking changes were found.`)
				process.exit(0)
			}
		} else {
			process.stdout.write(
				`💥 Break check failed to determine breaking changes.` +
					`\n` +
					inspect(returnValue),
			)
			process.exit(2)
		}
	}
}
