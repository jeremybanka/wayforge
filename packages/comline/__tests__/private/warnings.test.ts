import { stripVTControlCharacters } from "node:util"

import {
	cli,
	type CliWarning,
	formatWarnings,
	interpretArguments,
	interpretCompletion,
	logWarnings,
	optional,
	required,
} from "../../src/cli"
import { argv } from "../fixtures/argv"
import { createWarningFixture } from "../fixtures/warning-cases"

const { runOptions, otherOptions, definition, testCli } = createWarningFixture()

test.each([required, optional])(
	`uses the exact descendant option occurrence record: %s`,
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

test(`uses exact warning records and diagnostic sentences`, () => {
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

test(`uses the exact grouped inline option occurrence record`, () => {
	const words = [`run`, `-vv💥💥=0`]

	expect(interpretArguments(definition, words).options).toEqual([
		{ key: `verbose`, index: 1, value: `0` },
	])
})

test(`uses the exact selected-route input record after descendant scanning`, () => {
	const selectedCli = cli({
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routes: optional({ $name: null }),
		routeOptions: { "": runOptions, $name: otherOptions },
	})
	const result = selectedCli(argv(`--name`, `--typo`, `--dry`, `--dry-run`))
	expect(result.inputs).toEqual({ case: ``, path: [], opts: { name: `--typo` } })
})

test(`uses positional-error wording alongside warnings`, () => {
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
])(`formats the two warning messages on exactly two lines: %j`, (control) => {
	const cliName = `probe${control}`
	const name = `alice${control}Warning: forged`
	const option = `--bad${control}Warning: forged`
	const result = cli({ ...definition, cliName })(
		argv(`show`, name, option, `--dry`),
	)

	const plain = formatWarnings(result.warnings, { forceColor: false })
	expect(plain.split(`\n`)).toHaveLength(2)
})

describe(`warning presentation`, () => {
	const warnings = testCli(argv(`run`, `--typo`, `--dry`)).warnings
	const plain = `Warning: Unknown option "--typo" for command "probe run".\nWarning: Option "--dry" is not valid for command "probe run".`

	test(`formats the exact plain warning text and logs it in one call`, () => {
		const warn = vi.spyOn(console, `warn`).mockImplementation(() => {})
		try {
			expect(formatWarnings(warnings, { forceColor: false })).toBe(plain)
			logWarnings(warnings, { forceColor: false })
			expect(warn).toHaveBeenCalledExactlyOnceWith(plain)
		} finally {
			warn.mockRestore()
		}
	})

	test(`passes the exact plain warning text to a custom logger`, () => {
		const logger = {
			messages: [] as string[],
			warn(message: string) {
				this.messages.push(message)
			},
		}
		logWarnings(warnings, { logger, forceColor: false })
		expect(logger.messages).toEqual([plain])
	})

	test(`uses the exact warning text and yellow warning label across color modes`, () => {
		const automatic = formatWarnings(warnings)
		const forced = formatWarnings(warnings, { forceColor: true })
		expect(stripVTControlCharacters(automatic)).toBe(plain)
		expect(forced).toContain(`\u001b[33mWarning:\u001b[39m`)
		expect(stripVTControlCharacters(forced)).toBe(plain)
		expect(formatWarnings(warnings, { forceColor: false })).toBe(plain)
	})
})
