import { stripVTControlCharacters } from "node:util"

import z from "zod"

import {
	cli,
	type CliWarning,
	formatWarnings,
	interpretArguments,
	interpretCompletion,
	logWarnings,
	noOptions,
	optional,
	options,
	parseBooleanOption,
	required,
} from "../../src/cli"
import { argv } from "../fixtures/argv"

const runOptions = options(
	`run options`,
	z.object({ name: z.string().optional(), verbose: z.boolean().optional() }),
	{
		name: {
			description: `name`,
			example: `--name=value`,
			required: false,
			flag: `n`,
			aliases: [`label`],
		},
		verbose: {
			description: `verbose`,
			example: `--verbose`,
			required: false,
			flag: `v`,
			aliases: [`chatty`],
			parse: parseBooleanOption,
		},
	},
)
const otherOptions = options(
	`other options`,
	z.object({ dry: z.boolean().optional() }),
	{
		dry: {
			description: `dry run`,
			example: `--dry`,
			required: false,
			flag: `d`,
			aliases: [`dry-run`],
			parse: parseBooleanOption,
		},
	},
)
const definition = {
	cliName: `probe`,
	discoverConfigPath: () => undefined,
	routes: optional({
		run: null,
		other: null,
		duplicate: null,
		empty: null,
		show: required({ $name: null }),
	}),
	routeOptions: {
		"": noOptions(),
		run: runOptions,
		other: otherOptions,
		duplicate: otherOptions,
		empty: null,
		"show/$name": noOptions(),
	},
}
const testCli = cli(definition)

test.each([required, optional])(
	`unfinished routes defer warnings while descendant options consume values: %s`,
	(route) => {
		const unfinished = {
			cliName: `probe`,
			routes: route({ $target: null }),
			routeOptions: { $target: runOptions },
		}
		const words = [`--name`, `--typo`]
		for (const context of [
			interpretArguments(unfinished, words),
			interpretCompletion(unfinished, { words: [...words, ``] }),
		]) {
			expect(context.options).toEqual([
				{ key: `name`, index: 0, value: `--typo`, valueIndex: 1 },
			])
		}
	},
)

test(`returns public warning context with normalized argument indexes`, () => {
	const words = [`show`, `alice`, `--typo=value`, `--dry-run`]
	const expected: CliWarning[] = [
		{
			code: `unknown-option`,
			message: `Unknown option "--typo" for command "probe show alice".`,
			option: `--typo`,
			index: 2,
			cliName: `probe`,
			route: `show/$name`,
			path: [`show`, `alice`],
		},
		{
			code: `option-not-valid-for-route`,
			message: `Option "--dry-run" is not valid for command "probe show alice".`,
			option: `--dry-run`,
			index: 3,
			cliName: `probe`,
			route: `show/$name`,
			path: [`show`, `alice`],
		},
	]
	for (const prefix of [
		[`/usr/bin/node`, `/tmp/probe.ts`],
		[`arbitrary-runtime`, `renamed-entrypoint`],
		[`--runtime-option`, `--entrypoint-option`],
	]) {
		expect(testCli(Object.freeze([...prefix, ...words])).warnings).toEqual(
			expected,
		)
	}
	expect(interpretArguments(definition, words).warnings).toEqual(expected)
})

test(`shared classification preserves repeated Unicode flags and grouped inline values`, () => {
	const words = [`run`, `-vv💥💥=0`]

	expect(interpretArguments(definition, words).options).toEqual([
		{ key: `verbose`, index: 1, value: `0` },
	])
})

test(`descendant scan scores cannot change the selected route's warnings`, () => {
	const selectedCli = cli({
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routes: optional({ $name: null }),
		routeOptions: { "": runOptions, $name: otherOptions },
	})
	const result = selectedCli(argv(`--name`, `--typo`, `--dry`, `--dry-run`))
	expect(result.inputs).toEqual({ case: ``, path: [], opts: { name: `--typo` } })
})

test(`warnings do not suppress route and schema errors`, () => {
	expect(() => testCli(argv(`run`, `--typo`, `value`))).toThrow(
		/positional argument/,
	)
	expect(() => testCli(argv(`show`, `--typo`))).toThrow(/requires one/)
})

test.each([
	`\n`,
	`\r`,
	`\t`,
	`\u001b[2J`,
	`\u007f`,
	`\u009b2J`,
	`\u2028`,
	`\u202e`,
])(
	`escapes terminal controls in display messages while retaining raw fields: %j`,
	(control) => {
		const cliName = `probe${control}`
		const name = `alice${control}Warning: forged`
		const option = `--bad${control}Warning: forged`
		const result = cli({ ...definition, cliName })(
			argv(`show`, name, option, `--dry`),
		)

		const plain = formatWarnings(result.warnings, { forceColor: false })
		expect(plain.split(`\n`)).toHaveLength(2)
	},
)

describe(`warning presentation`, () => {
	const warnings = testCli(argv(`run`, `--typo`, `--dry`)).warnings
	const plain = `Warning: Unknown option "--typo" for command "probe run".\nWarning: Option "--dry" is not valid for command "probe run".`

	test(`formats reusable text and defaults to console.warn`, () => {
		const warn = vi.spyOn(console, `warn`).mockImplementation(() => {})
		try {
			expect(formatWarnings(warnings, { forceColor: false })).toBe(plain)
			logWarnings(warnings, { forceColor: false })
			expect(warn).toHaveBeenCalledExactlyOnceWith(plain)
		} finally {
			warn.mockRestore()
		}
	})

	test(`accepts a custom logger and retains its receiver`, () => {
		const logger = {
			messages: [] as string[],
			warn(message: string) {
				this.messages.push(message)
			},
		}
		logWarnings(warnings, { logger, forceColor: false })
		expect(logger.messages).toEqual([plain])
	})

	test(`supports automatic, disabled, and forced colors`, () => {
		const automatic = formatWarnings(warnings)
		const forced = formatWarnings(warnings, { forceColor: true })
		expect(stripVTControlCharacters(automatic)).toBe(plain)
		expect(forced).toContain(`\u001b[33mWarning:\u001b[39m`)
		expect(stripVTControlCharacters(forced)).toBe(plain)
		expect(formatWarnings(warnings, { forceColor: false })).toBe(plain)
	})
})
