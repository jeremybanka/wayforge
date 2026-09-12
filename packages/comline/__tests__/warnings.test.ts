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
} from "../src/cli"
import { argv } from "./fixtures/argv"

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

function occurrences(warnings: readonly CliWarning[]) {
	return warnings.map(({ code, option, index }) => ({ code, option, index }))
}

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
			expect(context.complete).toBe(route === optional)
			expect(context.options).toEqual([
				{ key: `name`, index: 0, value: `--typo`, valueIndex: 1 },
			])
			expect(context.warnings).toEqual([])
		}
		expect(interpretArguments(unfinished, [...words, `alice`]).warnings).toEqual(
			[],
		)
		expect(
			occurrences(
				interpretArguments(unfinished, [...words, `alice`, `--unknown`])
					.warnings,
			),
		).toEqual([{ code: `unknown-option`, option: `--unknown`, index: 3 }])
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

test.each([`--dry`, `--dry-run`, `-d`, `--dry=true`, `--dry-run=false`, `-d=0`])(
	`checks %s against the final route even before command selection`,
	(option) => {
		for (const words of [
			[option, `run`],
			[`run`, option],
		]) {
			expect(occurrences(testCli(argv(...words)).warnings)).toEqual([
				{
					code: `option-not-valid-for-route`,
					option: option.split(`=`)[0],
					index: words.indexOf(option),
				},
			])
			expect(testCli(argv(...words)).inputs.opts).toEqual({})
		}
	},
)

test.each([`--verbose`, `--chatty`, `-v`, `--chatty=true`, `-v=0`, `-vv`])(
	`recognizes valid flags and aliases before route selection: %s`,
	(option) => {
		expect(testCli(argv(option, `run`)).warnings).toEqual([])
	},
)

test.each([`--name=value`, `--label=value`, `-n=value`])(
	`recognizes valid value options: %s`,
	(option) => {
		const result = testCli(argv(option, `run`))
		expect(result.warnings).toEqual([])
		expect(result.inputs.opts).toEqual({ name: `value` })
	},
)

test(`reports individual grouped and repeated occurrences in argument order`, () => {
	const words = [`--typo=first`, `-vdxxd`, `run`, `--typo`, `-xd=0`, `-v`]
	expect(occurrences(testCli(argv(...words)).warnings)).toEqual([
		{ code: `unknown-option`, option: `--typo`, index: 0 },
		{ code: `option-not-valid-for-route`, option: `-d`, index: 1 },
		{ code: `unknown-option`, option: `-x`, index: 1 },
		{ code: `unknown-option`, option: `-x`, index: 1 },
		{ code: `option-not-valid-for-route`, option: `-d`, index: 1 },
		{ code: `unknown-option`, option: `--typo`, index: 3 },
		{ code: `unknown-option`, option: `-x`, index: 4 },
		{ code: `option-not-valid-for-route`, option: `-d`, index: 4 },
	])
})

test.each([[], [`empty`]])(`warns on routes without options: %j`, (...path) => {
	const result = testCli(argv(...path, `--verbose`, `--unknown`))
	expect(occurrences(result.warnings)).toEqual([
		{
			code: `option-not-valid-for-route`,
			option: `--verbose`,
			index: path.length,
		},
		{ code: `unknown-option`, option: `--unknown`, index: path.length + 1 },
	])
	expect(result.inputs.opts).toEqual({})
})

test.each([`--name`, `--label`, `-n`])(
	`does not warn about a dash-prefixed value consumed by %s`,
	(option) => {
		const result = testCli(argv(option, `--typo`, `run`, `--unknown`))
		expect(result.inputs.opts).toEqual({ name: `--typo` })
		expect(occurrences(result.warnings)).toEqual([
			{ code: `unknown-option`, option: `--unknown`, index: 3 },
		])
	},
)

test(`unselected route consumption cannot hide warnings`, () => {
	const result = testCli(argv(`--label`, `--typo`, `other`))
	expect(result.inputs.opts).toEqual({})
	expect(occurrences(result.warnings)).toEqual([
		{ code: `option-not-valid-for-route`, option: `--label`, index: 0 },
		{ code: `unknown-option`, option: `--typo`, index: 1 },
	])
})

test(`does not consume unknown options following a boolean`, () => {
	expect(
		occurrences(testCli(argv(`run`, `--verbose`, `--typo`)).warnings),
	).toEqual([{ code: `unknown-option`, option: `--typo`, index: 2 }])
})

test(`a sibling option consumed as a value does not produce a warning`, () => {
	const result = testCli(argv(`run`, `--name`, `--dry`))
	expect(result.inputs.opts).toEqual({ name: `--dry` })
	expect(result.warnings).toEqual([])
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
	expect(occurrences(result.warnings)).toEqual([
		{ code: `option-not-valid-for-route`, option: `--dry`, index: 2 },
		{ code: `option-not-valid-for-route`, option: `--dry-run`, index: 3 },
	])
})

test.each([`-=`, `-=oops`, `--=oops`])(
	`reports malformed option names unless consumed or after the delimiter: %s`,
	(word) => {
		const rootCli = cli({ cliName: `probe`, routeOptions: { "": runOptions } })
		expect(occurrences(rootCli(argv(word)).warnings)).toEqual([
			{ code: `unknown-option`, option: word.split(`=`)[0], index: 0 },
		])
		const consumed = rootCli(argv(`--name`, word))
		expect(consumed.inputs.opts).toEqual({ name: word })
		expect(consumed.warnings).toEqual([])
		expect(rootCli(argv(`--`, word)).warnings).toEqual([])
		expect(rootCli(argv(`-`)).warnings).toEqual([])
	},
)

test(`stops warnings at the delimiter and preserves literal route values`, () => {
	const result = testCli(argv(`--typo`, `show`, `--`, `--dry`))
	expect(result.inputs.path).toEqual([`show`, `--dry`])
	expect(occurrences(result.warnings)).toEqual([
		{ code: `unknown-option`, option: `--typo`, index: 0 },
	])
	const rootCli = cli({ cliName: `probe`, routeOptions: { "": null } })
	expect(rootCli(argv(`--`, `--unknown`, `-xxx`, `--`)).warnings).toEqual([])
	expect(testCli(argv(`run`, `--name=--`, `--`)).warnings).toEqual([])
})

test(`route-specific aliases are checked by spelling even with shared keys`, () => {
	const scopedCli = cli({
		...definition,
		routeOptions: {
			...definition.routeOptions,
			other: options(`different spellings`, runOptions.optionsSchema, {
				name: {
					...runOptions.optionConfigs.name,
					flag: `N`,
					aliases: [`title`],
				},
				verbose: runOptions.optionConfigs.verbose,
			}),
		},
	})
	expect(
		occurrences(scopedCli(argv(`run`, `--title=value`, `-N=value`)).warnings),
	).toEqual([
		{ code: `option-not-valid-for-route`, option: `--title`, index: 1 },
		{ code: `option-not-valid-for-route`, option: `-N`, index: 2 },
	])
})

test(`successful parsing always returns warnings and never logs them`, () => {
	const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() }
	const warn = vi.spyOn(console, `warn`).mockImplementation(() => {})
	const error = vi.spyOn(console, `error`).mockImplementation(() => {})
	try {
		const quietCli = cli(definition, logger)
		expect(quietCli(argv(`run`)).warnings).toEqual([])
		expect(quietCli(argv(`run`, `--typo`)).warnings).toHaveLength(1)
		expect(testCli(argv(`run`, `--typo`)).warnings).toHaveLength(1)
		for (const spy of [logger.info, logger.error, logger.warn, warn, error]) {
			expect(spy).not.toHaveBeenCalled()
		}
	} finally {
		warn.mockRestore()
		error.mockRestore()
	}
})

test(`warnings do not suppress route and schema errors`, () => {
	expect(() => testCli(argv(`run`, `--typo`, `value`))).toThrow(
		/positional argument/,
	)
	expect(() => testCli(argv(`show`, `--typo`))).toThrow(/requires one/)
	const validatedCli = cli({
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routeOptions: {
			"": options(
				`validated`,
				z.object({ name: z.string().min(3).optional() }),
				{
					name: runOptions.optionConfigs.name,
				},
			),
		},
	})
	expect(() => validatedCli(argv(`--name=a`, `--typo`))).toThrow()
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
		expect(result.inputs.path).toEqual([`show`, name])
		expect(result.warnings.map((warning) => warning.option)).toEqual([
			option,
			`--dry`,
		])
		for (const warning of result.warnings) {
			expect(warning.cliName).toBe(cliName)
			expect(warning.path).toEqual([`show`, name])
			expect(warning.message).not.toMatch(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u)
		}
		const plain = formatWarnings(result.warnings, { forceColor: false })
		expect(plain.split(`\n`)).toHaveLength(2)
		expect(
			stripVTControlCharacters(
				formatWarnings(result.warnings, { forceColor: true }),
			),
		).toBe(plain)
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

	test(`empty warnings produce no text or logging`, () => {
		const warn = vi.spyOn(console, `warn`).mockImplementation(() => {})
		const logger = { warn: vi.fn() }
		try {
			expect(formatWarnings([])).toBe(``)
			logWarnings([])
			logWarnings([], { logger })
			expect(warn).not.toHaveBeenCalled()
			expect(logger.warn).not.toHaveBeenCalled()
		} finally {
			warn.mockRestore()
		}
	})

	test(`supports automatic, disabled, and forced colors`, () => {
		const automatic = formatWarnings(warnings)
		const forced = formatWarnings(warnings, { forceColor: true })
		expect(stripVTControlCharacters(automatic)).toBe(plain)
		expect(forced).toContain(`\u001b[33mWarning:\u001b[39m`)
		expect(stripVTControlCharacters(forced)).toBe(plain)
		expect(formatWarnings(warnings, { forceColor: false })).toBe(plain)
		const logger = { warn: vi.fn() }
		logWarnings(warnings, { logger, forceColor: true })
		expect(logger.warn).toHaveBeenCalledWith(forced)
	})
})
