#!/usr/bin/env node

import * as path from "node:path"
import { inspect } from "node:util"

import { type } from "arktype"
import type { OptionsGroup } from "comline"
import {
	cli,
	completionResponse,
	encapsulate,
	help,
	logWarnings,
	noOptions,
	optional,
	options,
	parseBooleanOption,
} from "comline"
import logger from "takua"

import type { BreakCheckOptions } from "./break-check"
import { breakCheck, breakCheckPrelude } from "./break-check"

const BREAK_CHECK_MANUAL = options(
	`Check for breaking changes in a package.`,
	type({
		"tagPattern?": `string`,
		"baselineFile?": `string`,
		testPattern: `string`,
		testCommand: `string`,
		certifyCommand: `string`,
		"baseDirname?": `string`,
		"verbose?": `boolean`,
	}),
	{
		tagPattern: {
			aliases: [`tag-pattern`],
			completion: { repeatable: false },
			flag: `g`,
			required: false,
			description: `RegExp which, if found matched to a git tag, will be considered a release tag for your library.`,
			example: `--tagPattern="my-library"`,
		},
		baselineFile: {
			aliases: [`baseline-file`],
			completion: { repeatable: false, fileSystem: `files` },
			required: false,
			description: `Use the exact locally fetched commit from a prelude snapshot instead of discovering remote tags.`,
			example: `--baseline-file=.break-check/baseline.json`,
		},
		testPattern: {
			aliases: [`test-pattern`, `pattern`],
			completion: { repeatable: false },
			flag: `p`,
			required: true,
			description: `The pattern to match test files that test the public API of the library.`,
			example: `--pattern="*__public.test.ts"`,
		},
		testCommand: {
			aliases: [`test-command`],
			completion: { repeatable: false },
			flag: `t`,
			required: true,
			description: `Complete bash command that runs the tests for the library's public API.`,
			example: `--testCommand="npm run test"`,
		},
		certifyCommand: {
			aliases: [`certify-command`],
			completion: { repeatable: false },
			flag: `c`,
			required: true,
			description: `Complete bash command that determines whether a major version bump for your package is indicated in the workspace. Exit code 0 indicates that a major version bump is indicated, and exit code 1 indicates that no major version bump is indicated.`,
			example: `--certifyCommand=\tsx scripts/certify-major-version-bump.node`,
		},
		baseDirname: {
			aliases: [`base-dir`, `base-dirname`],
			completion: { repeatable: false, fileSystem: `directories` },
			flag: `d`,
			required: false,
			description: `The base directory to run the command from.`,
			example: `--baseDirname=./packages/my-package`,
		},
		verbose: {
			completion: { repeatable: false },
			flag: `v`,
			required: false,
			description: `Prints out more information about the process.`,
			example: `--verbose`,
			parse: parseBooleanOption,
		},
	},
) satisfies OptionsGroup<BreakCheckOptions>

const PRELUDE_MANUAL = options(
	`Resolve and fetch the release baseline for a cacheable compatibility check.`,
	type({
		"tagPattern?": `string`,
		"baseDirname?": `string`,
		"out?": `string`,
		"testPattern?": `string`,
		"testCommand?": `string`,
		"certifyCommand?": `string`,
		"baselineFile?": `string`,
		"verbose?": `boolean`,
	}),
	{
		...BREAK_CHECK_MANUAL.optionConfigs,
		testPattern: {
			...BREAK_CHECK_MANUAL.optionConfigs.testPattern,
			required: false,
		},
		testCommand: {
			...BREAK_CHECK_MANUAL.optionConfigs.testCommand,
			required: false,
		},
		certifyCommand: {
			...BREAK_CHECK_MANUAL.optionConfigs.certifyCommand,
			required: false,
		},
		out: {
			completion: { repeatable: false, fileSystem: `files` },
			required: false,
			description: `Gitignored snapshot path relative to the base directory (default: .break-check/baseline.json).`,
			example: `--out=.break-check/baseline.json`,
		},
	},
)

const SCHEMA_MANUAL = options(
	`Create a copy of the schema for configuring break-check.`,
	type({ "outdir?": `string` }),
	{
		outdir: {
			aliases: [`out-dir`],
			completion: { repeatable: false, fileSystem: `directories` },
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
		routes: optional({
			help: null,
			schema: null,
			prelude: optional({ $configPath: null }),
			$configPath: null,
		}),
		routeOptions: {
			"": BREAK_CHECK_MANUAL,
			$configPath: BREAK_CHECK_MANUAL,
			help: noOptions(`Show usage.`),
			schema: SCHEMA_MANUAL,
			prelude: PRELUDE_MANUAL,
			"prelude/$configPath": PRELUDE_MANUAL,
		},
		positionalCompletions: {
			$configPath: { fileSystem: `files` },
			"prelude/$configPath": { fileSystem: `files` },
		},
		discoverConfigPath: (args) => {
			if (args[0] === `help` || args[0] === `schema`) {
				return
			}
			const configPath =
				(args[0] === `prelude` ? args[1] : args[0]) ??
				path.join(process.cwd(), `break-check.config.json`)
			return configPath
		},
	},
	logger,
)

const completion = await completionResponse(parse.definition, process.argv)
if (completion !== undefined) {
	process.stdout.write(completion)
} else {
	const { inputs, warnings, writeJsonSchema } = parse(process.argv)
	logWarnings(warnings)

	switch (inputs.case) {
		case `help`:
			console.log(help(parse.definition))
			break
		case `schema`:
			{
				const { outdir } = inputs.opts
				writeJsonSchema(outdir ?? `.`)
				process.stdout.write(`📝 Wrote json.schema.`)
			}
			break
		case `prelude`:
		case `prelude/$configPath`: {
			const baseline = await breakCheckPrelude({
				...inputs.opts,
				out: inputs.opts.out ?? `.break-check/baseline.json`,
			})
			process.stdout.write(`Pinned ${baseline.ref} at ${baseline.commit}.\n`)
			break
		}
		case ``:
		case `$configPath`: {
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
}
