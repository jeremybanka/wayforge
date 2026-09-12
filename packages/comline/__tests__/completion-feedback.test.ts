import { optional, required } from "treetrunks"
import { vi } from "vitest"
import z from "zod"

import {
	cli,
	complete,
	type CompletionHints,
	interpretArguments,
	options,
	parseBooleanOption,
	parseNumberOption,
} from "../src/cli"
import { argv } from "./fixtures/argv"

function refOptions(completion: CompletionHints) {
	return options(`refs`, z.object({ ref: z.string().optional() }), {
		ref: {
			description: `ref`,
			example: ``,
			required: false,
			flag: `r`,
			completion,
		},
	})
}

test(`descendant option occurrences cannot erase the selected route's values`, () => {
	const definition = {
		cliName: `probe`,
		routes: optional({ $name: null }),
		routeOptions: {
			"": refOptions({}),
			$name: options(``, z.object({ other: z.string().optional() }), {
				other: { description: ``, example: ``, required: false },
			}),
		},
	}
	const words = [`--ref=main`, `--other=x`, `--other=y`]
	expect(cli(definition)(argv(...words)).inputs.opts).toEqual({ ref: `main` })
	expect(interpretArguments(definition, words).options).toEqual([
		{ key: `ref`, index: 0, value: `main` },
	])
})

test(`cloned hints do not repeat the same provider before route selection`, async () => {
	const provide = vi.fn(() => [`main`])
	const hints: CompletionHints = {
		provide,
		choices: [{ value: `master`, description: `legacy` }],
	}
	const result = await complete(
		{
			cliName: `probe`,
			routes: required({ a: null, b: null }),
			routeOptions: {
				a: refOptions(hints),
				b: refOptions({
					...hints,
					choices: [{ description: `legacy`, value: `master` }],
				}),
			},
		},
		{ words: [`--ref`, `ma`] },
	)
	expect(result.candidates.map(({ value }) => value)).toEqual([`master`, `main`])
	expect(result.context.targets).toHaveLength(1)
	expect(provide).toHaveBeenCalledTimes(1)
})

test(`distinct providers are not collapsed when their other hints match`, async () => {
	const a = vi.fn(() => [`alpha`])
	const b = vi.fn(() => [`beta`])
	const result = await complete(
		{
			cliName: `probe`,
			routes: required({ a: null, b: null }),
			routeOptions: {
				a: refOptions({ provide: a }),
				b: refOptions({ provide: b }),
			},
		},
		{ words: [`--ref`, ``] },
	)
	expect(result.candidates).toEqual([{ value: `alpha` }, { value: `beta` }])
	expect(a).toHaveBeenCalledTimes(1)
	expect(b).toHaveBeenCalledTimes(1)
})

test(`mixed boolean and positional hints retain all file candidates and each candidate's spacing`, async () => {
	const group = options(``, z.object({ draft: z.boolean().optional() }), {
		draft: {
			description: ``,
			example: ``,
			required: false,
			parse: parseBooleanOption,
			completion: {
				choices: [`false`],
				fileSystem: `files`,
				appendSpace: false,
			},
		},
	})
	const result = await complete(
		{
			cliName: `probe`,
			routes: optional({ run: null, $path: null }),
			routeOptions: { "": group, run: group, $path: group },
			positionalCompletions: {
				$path: {
					choices: [`folder`],
					fileSystem: `directories`,
					appendSpace: true,
				},
			},
		},
		{ words: [`--draft`, ``] },
	)
	expect(result.fileSystem).toBe(`files`)
	expect(result.appendSpace).toBe(false)
	expect(result.candidates).toEqual([
		{ value: `false` },
		{ value: `run`, description: ``, appendSpace: true },
		{ value: `folder`, appendSpace: true },
	])
})

test(`a positional no-space hint does not suppress spacing on literal commands`, async () => {
	const result = await complete(
		{
			cliName: `probe`,
			routes: required({ run: null, $path: null }),
			routeOptions: { run: null, $path: null },
			positionalCompletions: {
				$path: { choices: [`folder/`], appendSpace: false },
			},
		},
		{ words: [``] },
	)
	expect(result.appendSpace).toBe(false)
	expect(result.candidates).toEqual([
		{ value: `run`, description: ``, appendSpace: true },
		{ value: `folder/` },
	])
})

test(`ambiguous route hints merge independently of route declaration order`, async () => {
	const a = refOptions({
		choices: [`alpha`, `same`],
		fileSystem: `files`,
		appendSpace: false,
	})
	const b = refOptions({
		choices: [`beta`, `same`],
		fileSystem: `directories`,
		appendSpace: true,
	})
	for (const routeOptions of [
		{ a, b },
		{ b, a },
	]) {
		const result = await complete(
			{ cliName: `probe`, routes: required({ a: null, b: null }), routeOptions },
			{ words: [`--ref`, ``] },
		)
		expect(result.fileSystem).toBe(`files`)
		expect(result.appendSpace).toBe(false)
		expect(
			result.candidates.toSorted((left, right) =>
				left.value.localeCompare(right.value),
			),
		).toEqual([
			{ value: `alpha` },
			{ value: `beta`, appendSpace: true },
			{ value: `same` },
		])
	}
})

test(`provider candidates can override their target's spacing hint`, async () => {
	const result = await complete(
		{
			cliName: `probe`,
			routeOptions: {
				"": refOptions({
					appendSpace: false,
					provide: () => [{ value: `main`, appendSpace: true }],
				}),
			},
		},
		{ words: [`--ref`, ``] },
	)
	expect(result.appendSpace).toBe(false)
	expect(result.candidates).toEqual([{ value: `main`, appendSpace: true }])
})

test(`grouped inline values retain existing invocation semantics`, () => {
	const definition = {
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routeOptions: {
			"": options(``, z.object({ draft: z.boolean(), count: z.number() }), {
				draft: {
					description: ``,
					example: ``,
					required: true,
					flag: `d`,
					parse: parseBooleanOption,
				},
				count: {
					description: ``,
					example: ``,
					required: true,
					flag: `c`,
					parse: parseNumberOption,
				},
			}),
		},
	}
	expect(cli(definition)(argv(`-dc=0`)).inputs.opts).toEqual({
		draft: false,
		count: 0,
	})
	expect(interpretArguments(definition, [`-dc=0`]).options).toEqual([
		{ key: `draft`, index: 0, value: `0` },
		{ key: `count`, index: 0, value: `0` },
	])
})

test(`grouped inline completion recognizes flags before command selection`, async () => {
	const group = refOptions({ choices: [`main`] })
	const result = await complete(
		{
			cliName: `probe`,
			routes: required({ run: null }),
			routeOptions: { run: group },
		},
		{ words: [`-rr=ma`] },
	)
	expect(result.candidates).toEqual([{ value: `main` }])
	expect(result.context.targets).toHaveLength(1)
})

test.each([
	[`a`, `--ref`, ``],
	[`a`, `--ref=`],
])(`selected routes exclude sibling providers: %j`, async (...words) => {
	const provide = vi.fn(() => [`sibling`])
	const result = await complete(
		{
			cliName: `probe`,
			routes: required({ a: null, b: null }),
			routeOptions: { a: null, b: refOptions({ provide }) },
		},
		{ words },
	)
	expect(result.candidates).toEqual([])
	expect(provide).not.toHaveBeenCalled()
})

test(`unfinished nested routes keep only reachable provider fallbacks`, async () => {
	const reachable = vi.fn(() => [`reachable`])
	const sibling = vi.fn(() => [`sibling`])
	const definition = {
		cliName: `probe`,
		routes: required({ a: required({ run: null }), b: null }),
		routeOptions: {
			"a/run": refOptions({ provide: reachable }),
			b: refOptions({ provide: sibling }),
		},
	}
	const result = await complete(definition, { words: [`a`, `--ref`, ``] })
	expect(result.candidates).toEqual([{ value: `reachable` }])
	expect(reachable).toHaveBeenCalledOnce()
	expect(sibling).not.toHaveBeenCalled()
})

test(`pending values use their viable route grammar before presentation deduplication`, async () => {
	const input = {
		description: ``,
		example: ``,
		required: false,
		completion: { choices: [`--remote`, `--remote=value`] },
	}
	const definition = {
		cliName: `probe`,
		routes: required({ b: null, a: null }),
		routeOptions: {
			a: options(``, z.object({ input: z.string().optional() }), { input }),
			b: options(
				``,
				z.object({
					input: z.string().optional(),
					remote: z.boolean().optional(),
				}),
				{
					input,
					remote: {
						description: ``,
						example: ``,
						required: false,
						parse: parseBooleanOption,
					},
				},
			),
		},
	}
	for (const route of [[`a`], []]) {
		for (const prefix of [`--rem`, `--remote`, `--remote=`]) {
			const result = await complete(definition, {
				words: [...route, `--input`, prefix],
			})
			expect(result.candidates.map(({ value }) => value)).toEqual(
				input.completion.choices.filter((value) => value.startsWith(prefix)),
			)
		}
	}
	expect(cli(definition)(argv(`a`, `--input`, `--remote`)).inputs.opts).toEqual({
		input: `--remote`,
	})
	const sibling = await complete(definition, {
		words: [`b`, `--input`, `--remote`],
	})
	expect(sibling.context.targets).toEqual([{ kind: `option-name` }])
})

test(`optional positional routes retain distinct flags, choices, and providers`, async () => {
	const rootProvider = vi.fn(() => [`root-provider`])
	const childProvider = vi.fn(() => [`child-provider`])
	const root = refOptions({ choices: [`root`], provide: rootProvider })
	const child = refOptions({ choices: [`child`], provide: childProvider })
	child.optionConfigs.ref.flag = `s`
	const definition = {
		cliName: `probe`,
		routes: optional({ $name: null }),
		routeOptions: { "": root, $name: child },
		discoverConfigPath: () => undefined,
	}
	const names = await complete(definition, { words: [`-`] })
	expect(names.candidates.map(({ value }) => value)).toEqual([
		`--ref`,
		`-r`,
		`-s`,
	])
	const values = await complete(definition, { words: [`--ref`, ``] })
	expect(values.candidates.map(({ value }) => value)).toEqual([
		`root`,
		`root-provider`,
		`child`,
		`child-provider`,
	])
	expect(rootProvider).toHaveBeenCalledOnce()
	expect(childProvider).toHaveBeenCalledOnce()
	rootProvider.mockClear()
	childProvider.mockClear()
	const selected = await complete(definition, { words: [`alice`, `--ref`, ``] })
	expect(selected.candidates.map(({ value }) => value)).toEqual([
		`child`,
		`child-provider`,
	])
	expect(rootProvider).not.toHaveBeenCalled()
	// Execution uses only the final route's option definition.
	expect(cli(definition)(argv(`-r`, `root`)).inputs.opts).toEqual({
		ref: `root`,
	})
	expect(cli(definition)(argv(`alice`, `-s`, `child`)).inputs.opts).toEqual({
		ref: `child`,
	})
})

test(`same-name options retain distinct hints before optional positionals`, async () => {
	const result = await complete(
		{
			cliName: `probe`,
			routes: optional({ $name: null }),
			routeOptions: {
				"": refOptions({ choices: [`root`] }),
				$name: refOptions({ choices: [`child`] }),
			},
		},
		{ words: [`--ref`, ``] },
	)
	expect(result.candidates.map(({ value }) => value)).toEqual([`root`, `child`])
})

test(`metadata alternatives do not duplicate a raw option occurrence`, () => {
	const result = interpretArguments(
		{
			cliName: `probe`,
			routes: required({ $name: optional({ $other: null }) }),
			routeOptions: {
				$name: refOptions({ choices: [`first`] }),
				"$name/$other": refOptions({ choices: [`second`] }),
			},
		},
		[`--ref`, `value`],
	)
	expect(result.availableOptions).toHaveLength(2)
	expect(result.options).toEqual([
		{ key: `ref`, index: 0, value: `value`, valueIndex: 1 },
	])
})

test.each([
	{ words: [`--ref`, `main`, `--`] },
	{ words: [`-r`, `main`, `--`] },
	{ words: [`--ref=main`, `--`] },
	{ words: [`--ref`, `main`, `alice`, `--`] },
])(
	`non-repeatable descendant options are recognized before route selection: $words`,
	async ({ words }) => {
		const result = await complete(
			{
				cliName: `probe`,
				routes: optional({ $name: null }),
				routeOptions: { "": null, $name: refOptions({ repeatable: false }) },
			},
			{ words },
		)
		expect(result.candidates).toEqual([])
	},
)

test(`using a parent's flag does not suppress a distinct descendant flag with the same key`, async () => {
	const root = refOptions({ repeatable: false })
	const child = refOptions({ repeatable: false })
	child.optionConfigs.ref.flag = `s`
	const result = await complete(
		{
			cliName: `probe`,
			routes: optional({ $name: null }),
			routeOptions: { "": root, $name: child },
		},
		{ words: [`-r`, `main`, `-`] },
	)
	expect(result.candidates.map(({ value }) => value)).toEqual([`--ref`, `-s`])
})

test.each([
	{ words: [`--re`], names: [`--ref`, `--reference`] },
	{ words: [`pr`, `--re`], names: [`--ref`, `--reference`] },
	{ words: [`pr`, `-r`], names: [`-r`] },
	{ words: [`--ref`, `main`, `--re`], names: [] },
	{ words: [`pr`, `--ref=main`, `--re`], names: [] },
	{ words: [`other`, `--re`], names: [] },
])(
	`early option names follow reachable routes and repetition: $words`,
	async ({ words, names }) => {
		const group = refOptions({ repeatable: false })
		const withAlias = options(group.description, group.optionsSchema, {
			ref: { ...group.optionConfigs.ref, aliases: [`reference`] },
		})
		const result = await complete(
			{
				cliName: `probe`,
				routes: required({
					pr: required({ list: null, create: null }),
					other: null,
				}),
				routeOptions: {
					"pr/list": withAlias,
					"pr/create": withAlias,
					other: null,
				},
			},
			{ words },
		)
		expect(result.candidates.map(({ value }) => value)).toEqual(names)
	},
)

test.each([`configuration`, `choices`] as const)(
	`ordinary parsing never reads completion presentation: %s`,
	(level) => {
		const hints: CompletionHints = {}
		const group = refOptions(hints)
		const read = vi.fn(() => {
			throw new Error(`Completion presentation was read during parsing`)
		})
		Object.defineProperty(
			level === `configuration` ? group.optionConfigs.ref : hints,
			level === `configuration` ? `completion` : `choices`,
			{ get: read },
		)
		const parse = cli({
			cliName: `probe`,
			routes: optional({ $name: null }),
			routeOptions: { "": group, $name: group },
			discoverConfigPath: () => undefined,
		})
		expect(parse(argv(`--ref`, `main`)).inputs.opts).toEqual({ ref: `main` })
		expect(read).not.toHaveBeenCalled()
	},
)

test.each([
	{ words: [`--ref`], pending: [`ref`] },
	{ words: [`-r`], pending: [`ref`] },
	{ words: [`--ref=`], pending: [] },
	{ words: [`--ref`, `main`], pending: [] },
	{ words: [`-rr`], pending: [] },
	{ words: [`--`, `--ref`], pending: [] },
	{ words: [`--draft`], pending: [`draft`] },
	{ words: [`--draft`, `false`], pending: [] },
	{ words: [`--ref`, `--draft`], pending: [`draft`] },
])(
	`argument scans expose pending standalone values: $words`,
	({ words, pending }) => {
		const group = refOptions({})
		const definition = {
			cliName: `probe`,
			routeOptions: {
				"": options(
					``,
					z.object({
						ref: z.string().optional(),
						draft: z.boolean().optional(),
					}),
					{
						ref: group.optionConfigs.ref,
						draft: {
							description: ``,
							example: ``,
							required: false,
							parse: parseBooleanOption,
						},
					},
				),
			},
		}
		expect(
			interpretArguments(definition, words).pendingOptions.map(({ key }) => key),
		).toEqual(pending)
	},
)

function conflictingRouteOptions() {
	return {
		cliName: `probe`,
		routes: required({ a: required({ run: null }), b: null }),
		routeOptions: {
			"a/run": options(``, z.object({ flag: z.boolean().optional() }), {
				flag: {
					description: ``,
					example: ``,
					required: false,
					parse: parseBooleanOption,
				},
			}),
			b: options(``, z.object({ flag: z.string().optional() }), {
				flag: { description: ``, example: ``, required: false },
			}),
		},
		discoverConfigPath: () => undefined,
	}
}

test.each([
	{ words: [`a`, `--flag`, `run`], route: `a/run`, flag: true },
	{ words: [`--flag`, `a`, `run`], route: `a/run`, flag: true },
	{ words: [`--flag`, `false`, `a`, `run`], route: `a/run`, flag: false },
	{ words: [`b`, `--flag`, `run`], route: `b`, flag: `run` },
	{ words: [`--flag`, `run`, `b`], route: `b`, flag: `run` },
])(
	`route-specific consumption preserves command words: $words`,
	async ({ words, route, flag }) => {
		const definition = conflictingRouteOptions()
		expect(cli(definition)(argv(...words)).inputs).toMatchObject({
			case: route,
			opts: { flag },
		})
		const result = await complete(definition, { words: [...words, ``] })
		expect(result.context.route).toBe(route)
		expect(result.candidates).toEqual([])
	},
)

test(`unfinished selection keeps only viable consumption interpretations`, async () => {
	const result = await complete(conflictingRouteOptions(), {
		words: [`a`, `--flag`, ``],
	})
	expect(result.context.route).toBe(`a`)
	expect(
		result.context.targets
			.filter((target) => target.kind === `option-value`)
			.map((target) => target.option.valueKind),
	).toEqual([`boolean`])
	expect(result.candidates.map(({ value }) => value)).toContain(`run`)
})

test(`conflicting complete interpretations require an explicit boundary`, () => {
	const groups = conflictingRouteOptions().routeOptions
	const parse = cli({
		cliName: `probe`,
		routes: optional({ $name: null }),
		routeOptions: { "": groups.b, $name: groups[`a/run`] },
		discoverConfigPath: () => undefined,
	})
	expect(() => parse(argv(`--flag`, `bob`))).toThrow(
		/Ambiguous option consumption/,
	)
	expect(parse(argv(`--flag=`, `bob`)).inputs).toMatchObject({
		case: `$name`,
		opts: { flag: true },
	})
	expect(parse(argv(`--flag`, `--`, `bob`)).inputs).toMatchObject({
		case: `$name`,
		opts: { flag: true },
	})
})

test(`option identities distinguish routes and survive metadata changes`, () => {
	const group = refOptions({ choices: [`main`] })
	const definition = {
		cliName: `probe`,
		routes: optional({ $name: null }),
		routeOptions: { "": group, $name: group },
	}
	const first = interpretArguments(definition, [`--ref`, `main`])
	const ids = first.allOptions.map((option) => option.id)
	expect(new Set(ids).size).toBe(2)
	group.optionConfigs.ref.description = `Updated description`
	const second = interpretArguments(definition, [`--ref`, `main`])
	expect(second.allOptions.map((option) => option.id)).toEqual(ids)
	expect(second.suppliedOptions.map((option) => option.id)).toEqual(ids)
})
