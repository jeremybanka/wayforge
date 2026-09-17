import { optional, required } from "treetrunks"
import { vi } from "vitest"
import z from "zod"

import {
	cli,
	complete,
	interpretArguments,
	noOptions,
	options,
} from "../../src/cli"
import { argv } from "../fixtures/argv"
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

test(`uses positional-error wording and exact input records for descendant-only options`, () => {
	const command = cli({
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routes: optional({ run: null }),
		routeOptions: { "": noOptions(), run: refOptions({}) },
	})
	for (const words of [[`alice`], [`--unknown`, `alice`], [`--ref`, `alice`]]) {
		expect(() => command(argv(...words))).toThrow(/positional argument/)
	}

	expect(command(argv(`--ref`, `alice`, `run`)).inputs).toEqual({
		case: `run`,
		path: [`run`],
		params: {},
		opts: { ref: `alice` },
	})
	expect(command(argv(`--ref=alice`)).inputs).toEqual({
		case: ``,
		path: [],
		params: {},
		opts: {},
	})
})

test.each([optional, required])(
	`keeps exact input records when descendant options are added: %s`,
	(root) => {
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
		expect(before.inputs).toEqual({
			case: `$target`,
			path: [`alice`],
			params: { target: `alice` },
			opts: {},
		})

		const command = cli({
			...definition,
			routeOptions: {
				...definition.routeOptions,
				"$target/run": refOptions({}),
			},
		})
		const after = command(argv(`--ref`, `alice`))
		expect(after.inputs).toEqual(before.inputs)

		expect(command(argv(`--ref`, `alice`, `bob`, `run`)).inputs).toEqual({
			case: `$target/run`,
			path: [`bob`, `run`],
			params: { target: `bob` },
			opts: { ref: `alice` },
		})
	},
)

test(`omits extra fields from selected-route option occurrence records`, () => {
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

	expect(interpretArguments(definition, words).options).toEqual([
		{ key: `ref`, index: 0, value: `main` },
	])
})

test(`orders inline dash-prefixed choices before provider values`, async () => {
	const definition = createDashPrefixedValueDefinition()

	const inline = await complete(definition, { words: [`--ref=--con`] })
	expect(inline.candidates.map(({ value }) => value)).toEqual([
		`--confirm`,
		`--confetti`,
		`--confirm=value`,
	])
})

test(`orders static choices before provider values for cloned hints`, async () => {
	const { definition } = createClonedHintsFixture()
	const result = await complete(definition, { words: [`--ref`, `ma`] })
	expect(result.candidates.map(({ value }) => value)).toEqual([`master`, `main`])
})

test(`orders distinct providers by route and omits extra candidate fields`, async () => {
	const { definition } = createDistinctProvidersFixture()
	const result = await complete(definition, { words: [`--ref`, ``] })
	expect(result.candidates).toEqual([{ value: `alpha` }, { value: `beta` }])
})

test(`uses exact candidate records for mixed boolean and positional hints`, async () => {
	const definition = createMixedSpacingDefinition()
	const result = await complete(definition, { words: [`--draft`, ``] })

	expect(result.candidates).toEqual([
		{ value: `false` },
		{ value: `run`, description: ``, appendSpace: true },
		{ value: `folder`, appendSpace: true },
	])
})

test(`uses exact candidate records for commands beside a no-space positional`, async () => {
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

	expect(result.candidates).toEqual([
		{ value: `run`, description: ``, appendSpace: true },
		{ value: `folder/` },
	])
})

test(`uses exact merged candidate records in either route declaration order`, async () => {
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

test(`stores an explicit spacing override on the provider candidate`, async () => {
	const definition = createProviderSpacingDefinition()
	const result = await complete(definition, { words: [`--ref`, ``] })

	expect(result.candidates).toEqual([{ value: `main`, appendSpace: true }])
})

test(`uses exact option occurrence records for grouped inline values`, () => {
	const definition = createGroupedValueDefinition()

	expect(interpretArguments(definition, [`-dc=0`]).options).toEqual([
		{ key: `draft`, index: 0, value: `0` },
		{ key: `count`, index: 0, value: `0` },
	])
})

test(`omits extra candidate fields for grouped inline completion`, async () => {
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
})

test(`omits extra candidate fields for the reachable provider fallback`, async () => {
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
})

test(`orders pending value candidates and uses an exact sibling target record`, async () => {
	const { input, definition } = createPendingValueFixture()

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

	const sibling = await complete(definition, {
		words: [`b`, `--input`, `--remote`],
	})
	expect(sibling.context.targets).toEqual([{ kind: `option-name` }])
})

test(`orders root and child flags, choices, and provider values`, async () => {
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

	rootProvider.mockClear()
	childProvider.mockClear()
	const selected = await complete(definition, { words: [`alice`, `--ref`, ``] })
	expect(selected.candidates.map(({ value }) => value)).toEqual([
		`child`,
		`child-provider`,
	])
})

test(`orders root choices before optional positional choices`, async () => {
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

test(`uses an exact occurrence record for metadata alternatives`, () => {
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

	expect(result.options).toEqual([
		{ key: `ref`, index: 0, value: `value`, valueIndex: 1 },
	])
})

test(`orders the long name before the remaining descendant flag`, async () => {
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

test.each(earlyOptionCompletions)(
	`orders reachable option names before route selection: $words`,
	async ({ words, names }) => {
		const definition = createEarlyOptionDefinition()
		const result = await complete(definition, { words })
		expect(result.candidates.map(({ value }) => value)).toEqual(names)
	},
)

test(`uses ambiguity wording for conflicting option consumption`, () => {
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
})

test(`keeps option IDs stable and exact candidate records across metadata updates`, async () => {
	const group = refOptions({ choices: [`main`] })
	const definition = {
		cliName: `probe`,
		routes: optional({ $name: null }),
		routeOptions: { "": group, $name: group },
	}
	const first = interpretArguments(definition, [`--ref`, `main`])
	const ids = first.allOptions.map((option) => option.id)

	expect(
		(await complete(definition, { words: [`--ref`, ``] })).candidates,
	).toEqual([{ value: `main` }])
	group.optionConfigs.ref.description = `Updated description`
	group.optionConfigs.ref.completion = { choices: [`updated`] }
	const second = interpretArguments(definition, [`--ref`, `main`])
	expect(second.allOptions.map((option) => option.id)).toEqual(ids)
	expect(second.suppliedOptions.map((option) => option.id)).toEqual(ids)
	expect(
		(await complete(definition, { words: [`--ref`, ``] })).candidates,
	).toEqual([{ value: `updated` }])
})
