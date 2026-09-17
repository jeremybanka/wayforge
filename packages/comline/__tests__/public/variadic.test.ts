import { expectTypeOf } from "vitest"

import {
	cli,
	complete,
	help,
	interpretArguments,
	noOptions,
	optional,
	required,
	type Tree,
} from "../../src/cli"
import { argv } from "../fixtures/argv"
import { candidateValues, warningContext } from "../fixtures/contract-values"
import { createVariadicCli } from "../fixtures/variadic-cases"

const command = createVariadicCli()

test(`required rest captures reject zero paths`, () => {
	for (const words of [[`add`], [`add`, `--`], [`add`, `--label`, `docs`]]) {
		expect(() => command(argv(...words))).toThrow()
		const context = interpretArguments(command.definition, words)
		expect(context.complete).toBe(false)
		expect(context.route).toBe(`add`)
		expect(context.params).toEqual({})
	}
})

test.each([1, 2, 10000])(
	`accepts %i paths with a stable route identity`,
	(count) => {
		const paths = Array.from({ length: count }, (_, i) => `./file-${i}`)
		const { inputs } = command(argv(`add`, ...paths))
		if (inputs.case !== `add/$...paths`) throw new Error(`Unexpected route`)
		expect(inputs.path).toEqual([`add`, ...paths])
		expect(inputs.params.paths).toEqual(paths)
		expectTypeOf(inputs.params).toEqualTypeOf<{ paths: [string, ...string[]] }>()
	},
)

test(`preserves argv boundaries, duplicates, empty strings, and literal option spellings`, () => {
	const paths = [
		`./react/AGENTS.md`,
		`./my package/AGENTS.md`,
		`a,b`,
		`c=d`,
		``,
		`./react/AGENTS.md`,
		`$...paths`,
	]
	const { inputs } = command(
		argv(`add`, ...paths, `--`, `-file`, `--force`, `--`, ``),
	)
	expect(inputs.case).toBe(`add/$...paths`)
	expect(inputs.path).toEqual([`add`, ...paths, `-file`, `--force`, `--`, ``])
	expect(inputs.params).toEqual({
		paths: [...paths, `-file`, `--force`, `--`, ``],
	})
	expect(inputs.opts).toEqual({})
	expect(command(argv(`add`, ``)).inputs.params).toEqual({ paths: [``] })
	expect(command(argv(`add`, `$...paths`, `next`)).inputs.params).toEqual({
		paths: [`$...paths`, `next`],
	})
})

test(`optional rest captures select a distinct zero-path route`, () => {
	const empty = command(argv(`remove`)).inputs
	if (empty.case !== `remove`) throw new Error(`Unexpected route`)
	expect(empty.path).toEqual([`remove`])
	expect(empty.params).toEqual({})
	expectTypeOf(empty.params).toEqualTypeOf<{}>()
	const captured = command(argv(`remove`, `a`, `b`)).inputs
	if (captured.case !== `remove/$...paths`) throw new Error(`Unexpected route`)
	expect(captured.params.paths).toEqual([`a`, `b`])
	expectTypeOf(captured.params.paths).toEqualTypeOf<[string, ...string[]]>()
})

test(`infers named single captures and captures before a terminal rest`, () => {
	const inputs = command(argv(`project`, `website`, `add`, `a`, `b`)).inputs
	if (inputs.case !== `project/$name/add/$...paths`)
		throw new Error(`Unexpected route`)
	expect(inputs.params).toEqual({ name: `website`, paths: [`a`, `b`] })
	expectTypeOf(inputs.params).toEqualTypeOf<{
		name: string
		paths: [string, ...string[]]
	}>()
	const single = command(argv(`show`, `readme`)).inputs
	if (single.case !== `show/$name`) throw new Error(`Unexpected route`)
	expect(single.params).toEqual({ name: `readme` })
	expectTypeOf(single.params).toEqualTypeOf<{ name: string }>()
	// @ts-expect-error Rest captures only exist on the corresponding cases.
	single.params.paths
	expect(command(argv(`version`)).inputs.params).toEqual({})
	expect(command(argv()).inputs.params).toEqual({})
	expect(
		cli({ cliName: `plain`, routeOptions: { "": noOptions() } })(argv()).inputs
			.params,
	).toEqual({})
	expect(() => command(argv(`show`, `readme`, `extra`))).toThrow()
})

test.each([
	[`--label`, `docs`, `add`, `a`, `b`, `--force`],
	[`add`, `a`, `--label=docs`, `-f`, `b`],
	[`add`, `a`, `-l`, `docs`, `b`, `--force=true`],
	[`--tag=docs`, `add`, `--force`, `a`, `b`],
])(`uses the selected route's option grammar: %j`, (...words) => {
	const { inputs, warnings } = command(argv(...words))
	expect(inputs.params).toEqual({ paths: [`a`, `b`] })
	expect(inputs.opts).toEqual({ label: `docs`, force: true })
	expect(warnings).toEqual([])
})

test(`preserves route-specific option consumption and warnings`, () => {
	const { inputs, warnings } = command(
		argv(`--force`, `remove`, `a`, `--label`, `b`, `--typo`, `c`),
	)
	expect(inputs.params).toEqual({ paths: [`a`, `b`, `c`] })
	expect(warningContext(warnings)).toEqual([
		{
			code: `option-not-valid-for-route`,
			option: `--force`,
			index: 0,
			cliName: `agents`,
			route: `remove/$...paths`,
			path: [`remove`, `a`, `b`, `c`],
		},
		{
			code: `option-not-valid-for-route`,
			option: `--label`,
			index: 3,
			cliName: `agents`,
			route: `remove/$...paths`,
			path: [`remove`, `a`, `b`, `c`],
		},
		{
			code: `unknown-option`,
			option: `--typo`,
			index: 5,
			cliName: `agents`,
			route: `remove/$...paths`,
			path: [`remove`, `a`, `b`, `c`],
		},
	])
	expect(
		command(argv(`add`, `a`, `--label`, `--typo`, `b`)).inputs,
	).toMatchObject({ params: { paths: [`a`, `b`] }, opts: { label: `--typo` } })
})

test(`passes the full variadic path to configuration discovery`, () => {
	const discoverConfigPath = vi.fn(() => undefined)
	cli({ ...command.definition, discoverConfigPath })(argv(`add`, `a`, `b`))
	expect(discoverConfigPath).toHaveBeenCalledWith([`add`, `a`, `b`])
})

test.each([
	[
		`delimiter in a rest capture name`,
		required({ "$...paths/part": null }),
		/segment.*slash/i,
	],
	[
		`delimiter in a single capture name`,
		required({ show: required({ "$name/part": null }) }),
		/segment.*slash/i,
	],
	[
		`delimiter introducing a phantom capture`,
		required({ "literal/$name": null }),
		/segment.*slash/i,
	],
	[
		`nonterminal`,
		required({ "$...paths": required({ next: null }) }),
		/rest.*paths/i,
	],
	[
		`literal sibling`,
		required({ "$...paths": null, other: null }),
		/rest.*paths/i,
	],
	[
		`single capture sibling`,
		required({ "$...paths": null, $name: null }),
		/rest.*paths/i,
	],
	[`rest sibling`, required({ "$...paths": null, "$...other": null }), /rest/i],
	[`empty rest name`, required({ "$...": null }), /rest/i],
	[
		`repeated single name`,
		required({ $name: required({ $name: null }) }),
		/duplicate.*name/i,
	],
	[
		`repeated rest name`,
		required({ $paths: required({ "$...paths": null }) }),
		/duplicate.*paths/i,
	],
] satisfies [string, Tree, RegExp][])(
	`rejects %s definitions consistently`,
	(_label, routes, diagnostic) => {
		const definition = { cliName: `invalid`, routes, routeOptions: {} }
		expect(() => cli(definition)).toThrow(diagnostic)
		expect(() => interpretArguments(definition, [])).toThrow(diagnostic)
		expect(() => help(definition)).toThrow(diagnostic)
	},
)

test(`allows capture names on separate routes and safe own-property names`, () => {
	const named = cli({
		cliName: `named`,
		routes: optional({
			a: required({ $name: null }),
			b: required({ $name: null }),
			$__proto__: required({ "$...constructor": null }),
		}),
		routeOptions: {
			"": noOptions(),
			"a/$name": noOptions(),
			"b/$name": noOptions(),
			"$__proto__/$...constructor": noOptions(),
		},
	})
	expect(named(argv(`a`, `one`)).inputs.params).toEqual({ name: `one` })
	expect(named(argv(`b`, `two`)).inputs.params).toEqual({ name: `two` })
	const inputs = named(argv(`value`, `one`, `two`)).inputs
	expect(Object.hasOwn(inputs.params, `__proto__`)).toBe(true)
	expect(inputs.params).toEqual({
		[`__proto__`]: `value`,
		constructor: [`one`, `two`],
	})
})

test(`help shows the rest syntax, its cardinality, and the optional parent invocation`, () => {
	const manual = help(command.definition, { forceColor: false })
	expect(manual).toContain(`agents add <paths...>`)
	expect(manual).toMatch(/paths: one or more/i)
	expect(manual).toMatch(/agents remove\s+\.*\s*Choose files interactively/)
	expect(manual).toContain(`agents remove <paths...>`)
	expect(manual).toContain(`agents project <name> add <paths...>`)
})

test.each([[], [`a`], [`a`, `b`], [`a`, `--force`, `b`]])(
	`reuses completion hints for subsequent paths: %j`,
	async (...paths) => {
		const provide = vi.fn(() => [
			{ value: `next file`, description: `Another file` },
		])
		const definition = {
			...command.definition,
			positionalCompletions: {
				"add/$...paths": { fileSystem: `files` as const, provide },
			},
		}
		const result = await complete(definition, { words: [`add`, ...paths, ``] })
		expect(candidateValues(result.candidates)).toContain(`next file`)
		expect(
			result.candidates.find(({ value }) => value === `next file`)?.description,
		).toBe(`Another file`)
		expect(result.fileSystem).toBe(`files`)
		expect(result.diagnostics).toEqual([])
		expect(provide).toHaveBeenCalledOnce()
		expect(provide).toHaveBeenCalledWith(
			expect.objectContaining({
				path: [`add`, ...paths.filter((word) => word !== `--force`)],
				target: {
					kind: `positional`,
					name: `$...paths`,
					route: `add/$...paths`,
				},
			}),
		)
	},
)

test(`completion retains typed capture values, option targets, and literal words after --`, async () => {
	const provide = vi.fn(() => [`-next`])
	const definition = {
		...command.definition,
		positionalCompletions: { "project/$name/add/$...paths": { provide } },
	}
	const request = [`project`, `web`, `add`, `a`, `b`]
	const options = await complete(definition, { words: [...request, `--f`] })
	expect(candidateValues(options.candidates)).toContain(`--force`)
	expect(provide).not.toHaveBeenCalled()
	const value = command.interpret({ words: [`add`, `a`, `--label`, ``] })
	expect(value.targets).toEqual([
		expect.objectContaining({
			kind: `option-value`,
			option: expect.objectContaining({ key: `label` }),
		}),
	])
	const result = await complete(definition, {
		words: [...request, `--`, `-literal`, `-`],
	})
	expect(candidateValues(result.candidates)).toEqual([`-next`])
	expect(result.context.route).toBe(`project/$name/add/$...paths`)
	expect(result.context.params).toEqual({
		name: `web`,
		paths: [`a`, `b`, `-literal`],
	})
	expect(provide).toHaveBeenCalledWith(
		expect.objectContaining({
			params: { name: `web`, paths: [`a`, `b`, `-literal`] },
		}),
	)
})
