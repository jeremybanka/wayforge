#!/usr/bin/env node
import { appendFileSync } from "node:fs"

import { z } from "zod"

import {
	cli,
	completionResponse,
	optional,
	options,
	required,
} from "../../src/cli"

const shared = options(
	`Pull requests`,
	z.object({
		state: z.enum([`open`, `closed`, `all`]).optional(),
		base: z.string().optional(),
		input: z.string().optional(),
		directory: z.string().optional(),
		token: z.string().optional(),
		fail: z.string().optional(),
		confirm: z.string().optional(),
		empty: z.string().optional(),
	}),
	{
		state: { description: `PR state`, example: ``, required: false },
		base: {
			description: `Base branch`,
			example: ``,
			required: false,
			completion: {
				provide: () => [
					{ value: `main`, description: `Main branch` },
					{ value: `maintenance`, description: `Maintenance branch` },
					`feature branch`,
					`key=value`,
					`--key=value`,
					`star*branch`,
					`question?branch`,
					``,
					`~`,
					`...`,
					`nested/...`,
					`vertical\vtab`,
					`café`,
					`literal\\u000b`,
					`literal\\u{b}`,
					`quote'branch`,
					`double"branch`,
					`dollar$(touch injected)`,
				],
			},
		},
		input: {
			description: `Input file`,
			example: ``,
			required: false,
			completion: { fileSystem: `files` },
		},
		directory: {
			description: `Directory`,
			example: ``,
			required: false,
			completion: { fileSystem: `directories` },
		},
		token: {
			description: `Token prefix`,
			example: ``,
			required: false,
			completion: {
				choices: [`prefix/`, `plain`, { value: `spaced`, appendSpace: true }],
				appendSpace: false,
			},
		},
		empty: {
			description: `Empty value`,
			example: ``,
			required: false,
			completion: { choices: [``] },
		},
		confirm: {
			description: `Check a previous completion`,
			example: ``,
			required: false,
			completion: {
				provide: ({ options: occurrences }) => [
					[`café`, `vertical\vtab`].includes(
						occurrences.find(({ key }) => key === `base`)?.value ?? ``,
					)
						? `preserved`
						: `corrupt`,
				],
			},
		},
		fail: {
			description: `Broken provider`,
			example: ``,
			required: false,
			completion: {
				provide: () => {
					throw new Error(`provider unavailable`)
				},
			},
		},
	},
)
const definition = {
	cliName: `comline-fixture`,
	routes: required({
		pr: required({ list: optional({ $value: null }), create: null }),
	}),
	routeOptions: {
		"pr/list": shared,
		"pr/list/$value": shared,
		"pr/create": shared,
	},
	positionalCompletions: { "pr/list/$value": { choices: [`--key=value`] } },
	discoverConfigPath: () => {
		throw new Error(`Completion must not discover config`)
	},
}
const response = await completionResponse(definition, process.argv)
if (response !== undefined) {
	if (process.argv[2] === `completion` && process.env[`COMLINE_TEST_OUTPUT`])
		appendFileSync(
			process.env[`COMLINE_TEST_OUTPUT`],
			JSON.stringify({ response }) + `\n`,
		)
	process.stdout.write(response)
} else {
	const parse = cli({ ...definition, discoverConfigPath: () => undefined })
	const result = parse(process.argv)
	const output = JSON.stringify(result.inputs)
	if (process.env[`COMLINE_TEST_OUTPUT`])
		appendFileSync(process.env[`COMLINE_TEST_OUTPUT`], output + `\n`)
	console.log(output)
}
