import { type } from "arktype"
import { optional, required } from "treetrunks"
import { vi } from "vitest"
import z from "zod"

import {
	cli,
	complete,
	type CompletionProviderContext,
	interpretArguments,
	interpretCompletion,
	options,
	parseBooleanOption,
	parseNumberOption,
} from "../src/cli"
import { argv } from "./fixtures/argv"

const shared = options(
	`options`,
	z.object({
		repo: z.string().optional(),
		state: z.enum([`open`, `closed`, `all`]).optional(),
		draft: z.boolean().optional(),
		count: z.number().optional(),
		title: z.string().optional(),
		base: z.string().optional(),
		input: z.string().optional(),
		source: z.string().optional(),
	}),
	{
		repo: { description: `repository`, example: ``, required: false, flag: `R` },
		state: {
			description: `PR state`,
			example: ``,
			required: false,
			flag: `s`,
			aliases: [`pr-state`],
		},
		draft: {
			description: `draft PR`,
			example: ``,
			required: false,
			flag: `d`,
			parse: parseBooleanOption,
		},
		count: {
			description: `count`,
			example: ``,
			required: false,
			flag: `c`,
			parse: parseNumberOption,
		},
		title: {
			description: `title`,
			example: ``,
			required: false,
			flag: `t`,
			completion: { repeatable: false },
		},
		base: {
			description: `base branch`,
			example: ``,
			required: false,
			completion: {
				choices: [
					{ value: `main`, description: `default branch` },
					`feature/topic`,
				],
				appendSpace: false,
			},
		},
		input: {
			description: `input file`,
			example: ``,
			required: false,
			completion: { fileSystem: `files` },
		},
		source: {
			description: `source directory`,
			example: ``,
			required: false,
			completion: { fileSystem: `directories` },
		},
	},
)
const definition = {
	cliName: `fj`,
	discoverConfigPath: () => undefined,
	routes: required({
		pr: required({ list: null, create: null }),
		view: required({ $id: optional({ details: null }) }),
		checkout: optional({ $ref: null }),
	}),
	routeOptions: {
		"pr/list": { ...shared, description: `list pull requests` },
		"pr/create": { ...shared, description: `create a pull request` },
		"view/$id": shared,
		"view/$id/details": shared,
		checkout: shared,
		"checkout/$ref": shared,
	},
	positionalCompletions: {
		"view/$id": { choices: [`12`, `123`] },
		"checkout/$ref": { choices: [`main`, `feature/topic`] },
	},
}
const fj = cli(definition)
const values = async (...words: string[]) =>
	(await fj.complete({ words })).candidates.map(({ value }) => value)

test(`completes commands while tolerating required route nodes`, async () => {
	expect(await values(`pr`, `cr`)).toEqual([`create`])
	expect((await fj.complete({ words: [`pr`, `cr`] })).candidates).toEqual([
		{ value: `create`, description: `create a pull request` },
	])
	expect(fj.interpret({ words: [`pr`, ``] })).toMatchObject({
		route: `pr`,
		complete: false,
	})
	expect(await values(``)).toEqual([`pr`, `view`, `checkout`])
	expect(await values()).toEqual([`pr`, `view`, `checkout`])
})

test.each([
	[`pr`, `list`, `--state=cl`],
	[`pr`, `list`, `--state`, `cl`],
	[`pr`, `list`, `-s=cl`],
	[`pr`, `list`, `-s`, `cl`],
	[`pr`, `list`, `--pr-state=cl`],
	[`pr`, `list`, `--pr-state`, `cl`],
])(`completes enum values with shared aliases: %j`, async (...words) => {
	expect(await values(...words)).toEqual([`closed`])
})

test(`preserves long aliases in normal parsing`, () => {
	expect(fj(argv(`pr`, `list`, `--pr-state=closed`)).inputs.opts).toEqual({
		state: `closed`,
	})
})

test(`identifies options before command selection`, async () => {
	expect(await values(`-R`, `owner/repo`, `pr`, `cr`)).toEqual([`create`])
	expect(await values(`--state`, `cl`)).toEqual([`closed`])
	expect(await values(`--state=cl`)).toEqual([`closed`])
	expect(await values(`--pr-state=closed`, `pr`, `cr`)).toEqual([`create`])
})

test(`retains canonical option occurrences and actual positional values`, () => {
	const result = fj.interpret({
		words: [`-R`, `owner/repo`, `view`, `12`, `-ccc`, `--repo=second`, ``],
	})
	expect(result.route).toBe(`view/$id`)
	expect(result.path).toEqual([`view`, `12`])
	expect(result.options).toEqual([
		{ key: `repo`, index: 0, valueIndex: 1, value: `owner/repo` },
		{ key: `count`, index: 4, value: `,,` },
		{ key: `repo`, index: 5, value: `second` },
	])
})

test.each([[`view`], [`view`, `12`], [`checkout`], [`checkout`, `main`]])(
	`offers options around required and optional positionals: %j`,
	async (...path) => {
		expect(await values(...path, `--`)).toContain(`--repo`)
		expect(await values(...path, `-`)).toContain(`-R`)
	},
)

test(`completes variable positionals and preserves their following command grammar`, async () => {
	expect(await values(`view`, `1`)).toEqual([`12`, `123`])
	expect(await values(`view`, `12`, `d`)).toEqual([`details`])
	expect(await values(`checkout`, `fea`)).toEqual([`feature/topic`])
})

test(`known options do not become the preceding option's value`, async () => {
	const result = fj.interpret({
		words: [`pr`, `create`, `--title`, `--base`, `ma`],
	})
	expect(result.targets).toMatchObject([
		{ kind: `option-value`, option: { key: `base` } },
	])
	expect(await values(`pr`, `create`, `--title`, `--base`, `ma`)).toEqual([
		`main`,
	])
	expect(await values(`pr`, `create`, `--title`, `--draft`)).toContain(`--draft`)
})

test(`handles grouped flags without inventing attached short values`, async () => {
	expect(await values(`-dc`, `pr`, `cr`)).toEqual([`create`])
	expect(
		fj.interpret({ words: [`pr`, `create`, `-dc`, ``] }).options,
	).toMatchObject([
		{ key: `draft`, value: `` },
		{ key: `count`, value: `` },
	])
	expect(await values(`pr`, `create`, `-dd=f`)).toEqual([`false`])
})

test(`accepts partial separated boolean literals without losing command suggestions`, async () => {
	expect(await values(`pr`, `create`, `--draft`, `f`)).toEqual([`false`])
	expect(await values(`--draft`, `pr`, `cr`)).toEqual([`create`])
	expect(await values(`--draft`, `false`, `pr`, `cr`)).toEqual([`create`])
	expect(await values(`--draft`, ``)).toEqual(
		expect.arrayContaining([`true`, `false`, `0`, `1`, `pr`]),
	)
})

test(`retains repeatable scalar flags unless hints explicitly hide them`, async () => {
	const suggestions = await values(`pr`, `create`, `-cc`, `--title=a`, `--`)
	expect(suggestions).toContain(`--count`)
	expect(suggestions).toContain(`--repo`)
	expect(suggestions).not.toContain(`--title`)
})

test(`distinguishes an unfinished option prefix from a committed delimiter`, async () => {
	expect(await values(`pr`, `create`, `--`)).toContain(`--base`)
	expect(await values(`pr`, `create`, `--`, `--`)).toEqual([])
	expect(
		fj.interpret({ words: [`view`, `--`, `--repo=literal`, ``] }),
	).toMatchObject({
		path: [`view`, `--repo=literal`],
		options: [],
		positionalOnly: true,
	})
	expect(await values(`view`, `--`, `1`)).toEqual([`12`, `123`])
})

test(`uses explicit replacement ranges and ignores words after the cursor`, async () => {
	const result = await fj.complete({
		words: [`pr`, `list`, `--state=clutter`, `--title`, `ignored`],
		cursor: { word: 2, offset: 10 },
	})
	expect(result.context.prefix).toBe(`cl`)
	expect(result.context.replacement).toEqual({ word: 2, start: 8, end: 15 })
	expect(result.candidates.map(({ value }) => value)).toEqual([`closed`])
	expect(result.context.options).toEqual([])
})

test.each([
	{ word: -1, offset: 0 },
	{ word: 1, offset: 0 },
	{ word: 0, offset: 4 },
	{ word: 0.5, offset: 0 },
])(`rejects invalid cursor coordinates: %j`, (cursor) => {
	expect(() => fj.interpret({ words: [`pr`], cursor })).toThrow(RangeError)
})

test(`provides shell-neutral file and spacing hints`, async () => {
	expect(
		await fj.complete({ words: [`pr`, `create`, `--input=some path/`] }),
	).toMatchObject({
		fileSystem: `files`,
		context: { prefix: `some path/`, replacement: { start: 8 } },
	})
	expect(
		await fj.complete({ words: [`pr`, `create`, `--source`, ``] }),
	).toMatchObject({ fileSystem: `directories` })
	expect(
		await fj.complete({ words: [`pr`, `create`, `--base`, `ma`] }),
	).toMatchObject({
		appendSpace: false,
		candidates: [{ value: `main`, description: `default branch` }],
	})
})

test(`does not discover config, convert options, validate schemas, or invoke providers during interpretation`, async () => {
	const parse = vi.fn((value: string) => value)
	const provide = vi.fn(() => [`result`])
	const discoverConfigPath = vi.fn(() => {
		throw new Error(`config discovery must not run`)
	})
	const schema = z.object({ query: z.string(), required: z.string() })
	const validate = vi.spyOn(schema[`~standard`], `validate`)
	const command = cli({
		cliName: `query`,
		discoverConfigPath,
		routeOptions: {
			"": options(`query`, schema, {
				query: {
					description: ``,
					example: ``,
					required: false,
					parse,
					completion: { provide },
				},
				required: { description: ``, example: ``, required: true },
			}),
		},
	})
	expect(command.interpret({ words: [`--query`, `r`] }).targets).toMatchObject([
		{ kind: `option-value` },
	])
	expect(provide).not.toHaveBeenCalled()
	expect(
		(await command.complete({ words: [`--query`, `r`] })).candidates,
	).toEqual([{ value: `result` }])
	expect(discoverConfigPath).not.toHaveBeenCalled()
	expect(parse).not.toHaveBeenCalled()
	expect(validate).not.toHaveBeenCalled()
})

test(`never invokes completion providers during ordinary parsing`, () => {
	const provide = vi.fn(() => [`main`])
	const command = cli({
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routeOptions: {
			"": options(``, z.object({ ref: z.string() }), {
				ref: {
					description: ``,
					example: ``,
					required: true,
					completion: { provide },
				},
			}),
		},
	})
	expect(command(argv(`--ref=main`)).inputs.opts).toEqual({
		ref: `main`,
	})
	expect(provide).not.toHaveBeenCalled()
})

test(`dynamic providers receive raw options, positionals, target and cancellation signal`, async () => {
	const seen: CompletionProviderContext[] = []
	const controller = new AbortController()
	const result = await complete(
		{
			...definition,
			positionalCompletions: {
				"view/$id": {
					provide: async (context) => {
						seen.push(context)
						return Promise.resolve([
							{ value: `12`, description: `issue twelve` },
							`20`,
						])
					},
				},
			},
		},
		{ words: [`view`, `-R`, `owner/repo`, `1`], signal: controller.signal },
	)
	expect(result.candidates).toEqual([
		{ value: `12`, description: `issue twelve` },
	])
	expect(seen[0]).toMatchObject({
		route: `view`,
		path: [`view`],
		target: { kind: `positional`, route: `view/$id` },
		signal: controller.signal,
	})
	expect(seen[0].allOccurrences).toMatchObject([
		{ key: `repo`, value: `owner/repo` },
	])
})

test(`provider failures become diagnostics and cancellation discards results`, async () => {
	const failing = {
		...definition,
		positionalCompletions: {
			"view/$id": {
				provide: () => {
					throw new Error(`unavailable`)
				},
			},
		},
	}
	expect(await complete(failing, { words: [`view`, ``] })).toMatchObject({
		candidates: [],
		diagnostics: [`unavailable`],
	})
	const controller = new AbortController()
	const provide = vi.fn(() => {
		controller.abort()
		return [`12`]
	})
	const cancellable = {
		...definition,
		positionalCompletions: { "view/$id": { provide } },
	}
	expect(
		await complete(cancellable, {
			words: [`view`, ``],
			signal: controller.signal,
		}),
	).toMatchObject({ candidates: [], fileSystem: `none` })
	await complete(cancellable, { words: [`view`, ``], signal: controller.signal })
	expect(provide).toHaveBeenCalledTimes(1)
})

test(`returns invalid preceding arguments as diagnostics`, async () => {
	const result = await fj.complete({ words: [`pr`, `unknown`, ``] })
	expect(result.candidates).toEqual([])
	expect(result.diagnostics[0]).toContain(`unknown`)
})

test(`derives choices from Arktype and supports explicit boolean consumption overrides`, async () => {
	const probe = cli({
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routes: required({ run: null }),
		routeOptions: {
			run: options(
				``,
				type({ "state?": `'on' | 'off'`, "enabled?": `boolean | string` }),
				{
					state: { description: ``, example: ``, required: false },
					enabled: {
						description: ``,
						example: ``,
						required: false,
						parse: parseBooleanOption,
						valueKind: `boolean`,
						completion: { choices: [`true`, `false`] },
					},
				},
			),
		},
	})
	expect(
		(await probe.complete({ words: [`run`, `--state=o`] })).candidates,
	).toEqual([{ value: `off` }, { value: `on` }])
	expect(probe(argv(`--enabled`, `run`)).inputs.opts).toEqual({
		enabled: true,
	})
	expect(
		(await probe.complete({ words: [`--enabled`, `r`] })).candidates,
	).toEqual([{ value: `run`, description: `` }])
})

test(`completion exposes raw values while invocation converts them`, () => {
	const words = [`-R`, `owner/repo`, `pr`, `create`, `--count`, `-1`]
	expect(fj(argv(...words)).inputs).toEqual({
		case: `pr/create`,
		path: [`pr`, `create`],
		opts: { repo: `owner/repo`, count: -1 },
	})
	expect(fj.interpret({ words: [...words, ``] })).toMatchObject({
		route: `pr/create`,
		path: [`pr`, `create`],
		options: [
			{ key: `repo`, index: 0, valueIndex: 1, value: `owner/repo` },
			{ key: `count`, index: 4, valueIndex: 5, value: `-1` },
		],
	})
})

test(`reads a shared schema only once per interpretation and sees later definition changes`, () => {
	const schema = shared.optionsSchema[`~standard`].jsonSchema
	const input = vi.spyOn(schema, `input`)
	interpretArguments(definition, [`pr`, `create`])
	expect(input).toHaveBeenCalledTimes(1)
	input.mockRestore()
	const changed = {
		...definition,
		routeOptions: {
			...definition.routeOptions,
			"pr/create": {
				...shared,
				optionConfigs: {
					...shared.optionConfigs,
					base: { ...shared.optionConfigs.base, aliases: [`branch`] },
				},
			},
		},
	}
	expect(
		interpretArguments(changed, [`pr`, `create`, `--branch=main`]).options,
	).toMatchObject([{ key: `base`, value: `main` }])
})

test(`uses explicit hints when JSON Schema export is unavailable`, async () => {
	const schema = z.object({ state: z.string().optional() })
	const input = vi
		.spyOn(schema[`~standard`].jsonSchema, `input`)
		.mockImplementation(() => {
			throw new Error(`unsupported schema`)
		})
	try {
		const result = await complete(
			{
				cliName: `probe`,
				routeOptions: {
					"": options(``, schema, {
						state: {
							description: ``,
							example: ``,
							required: false,
							completion: { choices: [`on`, `off`] },
						},
					}),
				},
			},
			{ words: [`--state=o`] },
		)
		expect(result.candidates).toEqual([{ value: `on` }, { value: `off` }])
	} finally {
		input.mockRestore()
	}
})

test(`an option value containing the executable name remains a value`, () => {
	const command = cli({
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routeOptions: {
			"": options(``, z.object({ name: z.string() }), {
				name: { description: ``, example: ``, required: true },
			}),
		},
	})
	expect(command(argv(`--name`, `probe`)).inputs.opts).toEqual({
		name: `probe`,
	})
	expect(command(argv(`--name=probe`)).inputs.opts).toEqual({
		name: `probe`,
	})
})

test(`option hiding follows the selected route when routes reuse a canonical key`, async () => {
	const a = options(``, z.object({ title: z.string().optional() }), {
		title: {
			description: ``,
			example: ``,
			required: false,
			flag: `a`,
			completion: { repeatable: false },
		},
	})
	const b = options(``, z.object({ title: z.string().optional() }), {
		title: {
			description: ``,
			example: ``,
			required: false,
			flag: `b`,
			completion: { repeatable: false },
		},
	})
	const command = cli({
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routes: required({ a: null, b: null }),
		routeOptions: { a, b },
	})
	expect(command(argv(`b`, `-a=other-route`)).inputs.opts).toEqual({})
	expect(
		(
			await command.complete({ words: [`b`, `-a=other-route`, `--`] })
		).candidates.map(({ value }) => value),
	).toContain(`--title`)
})
