#!/usr/bin/env node

import * as path from "node:path"

import type { OptionsGroup } from "comline"
import {
	cli,
	encapsulate,
	help,
	helpOption,
	optional,
	parseBooleanOption,
} from "comline"
import { z } from "zod/v4"

import type { CreateAtomOptions } from "./create-atom"
import { createAtom } from "./create-atom"

const helper = helpOption()

const BREAK_CHECK_MANUAL = {
	description: `Check for breaking changes in a package.`,
	optionsSchema: z.object({
		tagPattern: z.string().optional(),
		testPattern: z.string(),
		testCommand: z.string(),
		certifyCommand: z.string(),
		verbose: z.boolean().optional(),
		help: z.boolean().optional(),
	}),
	options: {
		...helper.options,
		packageManager: {
			flag: `m`,
			required: false,
			description: `The package manager to use.`,
			example: `--packageManager="npm"`,
		},
		// tagPattern: {
		// 	flag: `v`,
		// 	required: false,
		// 	description: `String which, if found in a git tag, will be considered a release tag for your library.`,
		// 	example: `--tagPattern="my-library"`,
		// },
		// testPattern: {
		// 	flag: `p`,
		// 	required: true,
		// 	description: `The pattern to match test files that test the public API of the library.`,
		// 	example: `--pattern="*__public.test.ts"`,
		// },
		// testCommand: {
		// 	flag: `t`,
		// 	required: true,
		// 	description: `Complete bash command that runs the tests for the library's public API.`,
		// 	example: `--testCommand="npm run test"`,
		// },
		// certifyCommand: {
		// 	flag: `c`,
		// 	required: true,
		// 	description: `Complete bash command that determines whether a major version bump for your package is indicated in the workspace. Exit code 0 indicates that a major version bump is indicated, and exit code 1 indicates that no major version bump is indicated.`,
		// 	example: `--certifyCommand=\tsx scripts/certify-major-version-bump.node`,
		// },
		// verbose: {
		// 	flag: `v`,
		// 	required: false,
		// 	description: `Prints out more information about the process.`,
		// 	example: `--verbose`,
		// 	parse: parseBooleanOption,
		// },
	},
} satisfies OptionsGroup<CreateAtomOptions & { help?: boolean | undefined }>

const parse = cli(
	{
		cliName: `create-atom`,
		routes: optional({ projectName: null }),
		routeOptions: {
			"": BREAK_CHECK_MANUAL,
			projectName: BREAK_CHECK_MANUAL,
		},
		discoverConfigPath: (args) => {
			if (args[0] === `schema`) {
				return
			}
			const configPath =
				args[0] ?? path.join(process.cwd(), `create-atom.config.json`)
			return configPath
		},
	},
	console,
)
const { inputs, writeJsonSchema } = parse(process.argv)

if (inputs.opts.help) {
	console.log(help(parse.definition))
}

const { returnValue } = await encapsulate(() => createAtom(inputs.opts), {
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
			process.stdout.write(`❌ Breaking changes were found, but not certified.`)
			process.exit(1)
		}
	} else {
		process.stdout.write(`✅ No breaking changes were found.`)
		process.exit(0)
	}
} else {
	process.stdout.write(`💥 Break check failed to determine breaking changes.`)
	process.exit(2)
}
