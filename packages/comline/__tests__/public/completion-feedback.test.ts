import { optional, required } from "treetrunks"
import { vi } from "vitest"
import z from "zod"

import {
	cli,
	complete,
	type CompletionHints,
	interpretArguments,
	noOptions,
	options,
	parseBooleanOption,
} from "../../src/cli"
import { argv } from "../fixtures/argv"
import {
	candidateSpacing,
	candidateValues,
	inputValues,
	optionOccurrences,
} from "../fixtures/contract-values"
import {
	conflictingRouteOptions,
	createClonedHintsFixture,
	createDashPrefixedValueDefinition,
	createDistinctProvidersFixture,
	createEarlyOptionDefinition,
	createGroupedValueDefinition,
	createMixedSpacingDefinition,
	createPendingValueFixture,
	createProviderSpacingDefinition,
	earlyOptionCompletions,
	refOptions,
} from "../fixtures/feedback-cases"

test(`final invocation cannot discard positionals consumed only by a descendant grammar`, async () => {
	const command = cli({
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routes: optional({ run: null }),
		routeOptions: { "": noOptions(), run: refOptions({}) },
	})
	for (const words of [[`alice`], [`--unknown`, `alice`], [`--ref`, `alice`]]) {
		expect(() => command(argv(...words))).toThrow()
	}
	// The same words remain valid unfinished input when a command follows.
	const completion = await command.complete({ words: [`--ref`, `alice`, `r`] })
	expect(completion.context.error).toBeUndefined()
	expect(completion.candidates).toContainEqual({
		value: `run`,
		description: `refs`,
	})
	expect(inputValues(command(argv(`--ref`, `alice`, `run`)).inputs)).toEqual(
		inputValues({
			case: `run`,
			path: [`run`],
			opts: { ref: `alice` },
		}),
	)
	expect(inputValues(command(argv(`--ref=alice`)).inputs)).toEqual(
		inputValues({
			case: ``,
			path: [],
			opts: {},
		}),
	)
})

test.each([optional, required])(
	`descendant options cannot invalidate a self-consistent executable interpretation: %s`,
	async (root) => {
		const definition = {
			cliName: `probe`,
			discoverConfigPath: () => undefined,
			routes: root({ $target: optional({ run: null }) }),
			routeOptions: {
				"": noOptions(),
				$target: noOptions(),
				"$target/run": noOptions(),
			},
		}
		const before = cli(definition)(argv(`--ref`, `alice`))
		expect(inputValues(before.inputs)).toEqual(
			inputValues({ case: `$target`, path: [`alice`], opts: {} }),
		)
		expect(before.warnings[0].code).toBe(`unknown-option`)
		const command = cli({
			...definition,
			routeOptions: {
				...definition.routeOptions,
				"$target/run": refOptions({}),
			},
		})
		const after = command(argv(`--ref`, `alice`))
		expect(inputValues(after.inputs)).toEqual(inputValues(before.inputs))
		expect(after.warnings).toEqual([
			expect.objectContaining({
				code: `option-not-valid-for-route`,
				option: `--ref`,
				route: `$target`,
				path: [`alice`],
			}),
		])
		expect(command(argv(`alice`)).inputs.path).toEqual([`alice`])
		expect(
			inputValues(command(argv(`--ref`, `alice`, `bob`, `run`)).inputs),
		).toEqual(
			inputValues({
				case: `$target/run`,
				path: [`bob`, `run`],
				opts: { ref: `alice` },
			}),
		)
		const completion = await command.complete({
			words: [`--ref`, `alice`, `bob`, `r`],
		})
		expect(completion.context.error).toBeUndefined()
		expect(completion.context.path).toEqual([`bob`])
		expect(completion.candidates).toContainEqual({
			value: `run`,
			description: `refs`,
		})
	},
)

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
	expect(
		optionOccurrences(interpretArguments(definition, words).options),
	).toEqual(optionOccurrences([{ key: `ref`, index: 0, value: `main` }]))
})

test(`accepted value candidates preserve their target's consumption rules`, async () => {
	const definition = createDashPrefixedValueDefinition()
	const separated = await complete(definition, { words: [`--ref`, `--con`] })
	expect(separated.candidates.map(({ value }) => value)).toEqual([`--confetti`])
	for (const { value } of separated.candidates)
		expect(cli(definition)(argv(`--ref`, value)).inputs.opts).toEqual({
			ref: value,
		})
	const inline = await complete(definition, { words: [`--ref=--con`] })
	expect(inline.candidates.map(({ value }) => value).toSorted()).toEqual(
		[`--confirm`, `--confetti`, `--confirm=value`].toSorted(),
	)
	for (const { value } of inline.candidates)
		expect(cli(definition)(argv(`--ref=${value}`)).inputs.opts).toEqual({
			ref: value,
		})
})

test(`cloned hints do not repeat the same provider before route selection`, async () => {
	const { provide, definition } = createClonedHintsFixture()
	const result = await complete(definition, { words: [`--ref`, `ma`] })
	expect(result.candidates.map(({ value }) => value).toSorted()).toEqual(
		[`master`, `main`].toSorted(),
	)
	expect(result.context.targets).toHaveLength(1)
	expect(provide).toHaveBeenCalledTimes(1)
})

test(`distinct providers are not collapsed when their other hints match`, async () => {
	const { a, b, definition } = createDistinctProvidersFixture()
	const result = await complete(definition, { words: [`--ref`, ``] })
	expect(candidateValues(result.candidates)).toEqual(
		candidateValues([{ value: `alpha` }, { value: `beta` }]),
	)
	expect(a).toHaveBeenCalledTimes(1)
	expect(b).toHaveBeenCalledTimes(1)
})

test(`mixed boolean and positional hints retain all file candidates and each candidate's spacing`, async () => {
	const definition = createMixedSpacingDefinition()
	const result = await complete(definition, { words: [`--draft`, ``] })
	expect(result.fileSystem).toBe(`files`)
	expect(result.appendSpace).toBe(false)
	expect(candidateSpacing(result)).toEqual([
		{ value: `false`, appendSpace: false },
		{ value: `folder`, appendSpace: true },
		{ value: `run`, appendSpace: true },
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
	expect(candidateSpacing(result)).toEqual([
		{ value: `folder/`, appendSpace: false },
		{ value: `run`, appendSpace: true },
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
		expect(candidateSpacing(result)).toEqual([
			{ value: `alpha`, appendSpace: false },
			{ value: `beta`, appendSpace: true },
			{ value: `same`, appendSpace: false },
		])
	}
})

test(`provider candidates can override their target's spacing hint`, async () => {
	const definition = createProviderSpacingDefinition()
	const result = await complete(definition, { words: [`--ref`, ``] })
	expect(result.appendSpace).toBe(false)
	expect(candidateSpacing(result)).toEqual([
		{ value: `main`, appendSpace: true },
	])
})

test(`grouped inline values retain existing invocation semantics`, () => {
	const definition = createGroupedValueDefinition()
	expect(cli(definition)(argv(`-dc=0`)).inputs.opts).toEqual({
		draft: false,
		count: 0,
	})
	expect(
		optionOccurrences(interpretArguments(definition, [`-dc=0`]).options),
	).toEqual(
		optionOccurrences([
			{ key: `draft`, index: 0, value: `0` },
			{ key: `count`, index: 0, value: `0` },
		]),
	)
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
	expect(candidateValues(result.candidates)).toEqual(
		candidateValues([{ value: `main` }]),
	)
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
	expect(candidateValues(result.candidates)).toEqual(
		candidateValues([{ value: `reachable` }]),
	)
	expect(reachable).toHaveBeenCalledOnce()
	expect(sibling).not.toHaveBeenCalled()
})

test(`pending values use their viable route grammar before presentation deduplication`, async () => {
	const { input, definition } = createPendingValueFixture()

	for (const route of [[`a`], []]) {
		for (const prefix of [`--rem`, `--remote`, `--remote=`]) {
			const result = await complete(definition, {
				words: [...route, `--input`, prefix],
			})
			expect(result.candidates.map(({ value }) => value).toSorted()).toEqual(
				input.completion.choices
					.filter((value) => value.startsWith(prefix))
					.toSorted(),
			)
		}
	}
	expect(cli(definition)(argv(`a`, `--input`, `--remote`)).inputs.opts).toEqual({
		input: `--remote`,
	})
	const sibling = await complete(definition, {
		words: [`b`, `--input`, `--remote`],
	})
	expect(sibling.context.targets).toMatchObject([{ kind: `option-name` }])
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
	expect(names.candidates.map(({ value }) => value).toSorted()).toEqual(
		[`--ref`, `-r`, `-s`].toSorted(),
	)
	const values = await complete(definition, { words: [`--ref`, ``] })
	expect(values.candidates.map(({ value }) => value).toSorted()).toEqual(
		[`root`, `root-provider`, `child`, `child-provider`].toSorted(),
	)
	expect(rootProvider).toHaveBeenCalledOnce()
	expect(childProvider).toHaveBeenCalledOnce()
	rootProvider.mockClear()
	childProvider.mockClear()
	const selected = await complete(definition, { words: [`alice`, `--ref`, ``] })
	expect(selected.candidates.map(({ value }) => value).toSorted()).toEqual(
		[`child`, `child-provider`].toSorted(),
	)
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
	expect(result.candidates.map(({ value }) => value).toSorted()).toEqual(
		[`root`, `child`].toSorted(),
	)
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
	expect(optionOccurrences(result.options)).toEqual(
		optionOccurrences([{ key: `ref`, index: 0, value: `value`, valueIndex: 1 }]),
	)
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
	expect(result.candidates.map(({ value }) => value).toSorted()).toEqual(
		[`--ref`, `-s`].toSorted(),
	)
})

test.each(earlyOptionCompletions)(
	`early option names follow reachable routes and repetition: $words`,
	async ({ words, names }) => {
		const definition = createEarlyOptionDefinition()
		const result = await complete(definition, { words })
		expect(result.candidates.map(({ value }) => value).toSorted()).toEqual(
			names.toSorted(),
		)
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
	expect(() => parse(argv(`--flag`, `bob`))).toThrow()
	expect(parse(argv(`--flag=`, `bob`)).inputs).toMatchObject({
		case: `$name`,
		opts: { flag: true },
	})
	expect(parse(argv(`--flag`, `--`, `bob`)).inputs).toMatchObject({
		case: `$name`,
		opts: { flag: true },
	})
})

test(`option identities distinguish routes and metadata stays fresh between requests`, async () => {
	const group = refOptions({ choices: [`main`] })
	const definition = {
		cliName: `probe`,
		routes: optional({ $name: null }),
		routeOptions: { "": group, $name: group },
	}
	const first = interpretArguments(definition, [`--ref`, `main`])
	const ids = first.allOptions.map((option) => option.id)
	expect(new Set(ids).size).toBe(2)
	expect(
		candidateValues(
			(await complete(definition, { words: [`--ref`, ``] })).candidates,
		),
	).toEqual(candidateValues([{ value: `main` }]))
	group.optionConfigs.ref.description = `Updated description`
	group.optionConfigs.ref.completion = { choices: [`updated`] }
	const second = interpretArguments(definition, [`--ref`, `main`])
	expect(second.allOptions.map((option) => option.id).toSorted()).toEqual(
		ids.toSorted(),
	)
	expect(second.suppliedOptions.map((option) => option.id).toSorted()).toEqual(
		ids.toSorted(),
	)
	expect(
		candidateValues(
			(await complete(definition, { words: [`--ref`, ``] })).candidates,
		),
	).toEqual(candidateValues([{ value: `updated` }]))
})
