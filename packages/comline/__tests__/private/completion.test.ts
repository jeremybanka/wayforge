import { type } from "arktype"
import { optional, required } from "treetrunks"
import { vi } from "vitest"
import z from "zod"

import {
	cli,
	complete,
	type CompletionProviderContext,
	options,
	parseBooleanOption,
	parseNumberOption,
} from "../../src/cli"
import { argv } from "../fixtures/argv"

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
	expect((await fj.complete({ words: [`pr`, `cr`] })).candidates).toEqual([
		{ value: `create`, description: `create a pull request` },
	])

	expect(await values(``)).toEqual([`pr`, `view`, `checkout`])
	expect(await values()).toEqual([`pr`, `view`, `checkout`])
})

test(`retains canonical option occurrences and actual positional values`, () => {
	const result = fj.interpret({
		words: [`-R`, `owner/repo`, `view`, `12`, `-ccc`, `--repo=second`, ``],
	})

	expect(result.options).toEqual([
		{ key: `repo`, index: 0, valueIndex: 1, value: `owner/repo` },
		{ key: `count`, index: 4, value: `,,` },
		{ key: `repo`, index: 5, value: `second` },
	])
})

test(`completes variable positionals and preserves their following command grammar`, async () => {
	expect(await values(`view`, `1`)).toEqual([`12`, `123`])
})

test(`distinguishes an unfinished option prefix from a committed delimiter`, async () => {
	expect(await values(`view`, `--`, `1`)).toEqual([`12`, `123`])
})

test(`uses explicit replacement ranges and ignores words after the cursor`, async () => {
	const result = await fj.complete({
		words: [`pr`, `list`, `--state=clutter`, `--title`, `ignored`],
		cursor: { word: 2, offset: 10 },
	})

	expect(result.context.replacement).toEqual({ word: 2, start: 8, end: 15 })
})

test(`does not discover config, convert options, validate schemas, or invoke providers during interpretation`, async () => {
	const parse = vi.fn((value: string) => value)
	const provide = vi.fn(() => [`result`])
	const discoverConfigPath = vi.fn(() => {
		throw new Error(`config discovery must not run`)
	})
	const schema = z.object({ query: z.string(), required: z.string() })
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

	expect(
		(await command.complete({ words: [`--query`, `r`] })).candidates,
	).toEqual([{ value: `result` }])
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

	await complete(cancellable, { words: [`view`, ``], signal: controller.signal })
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
