import { vi } from "vitest"
import z from "zod"

import {
	cli,
	complete,
	type CompletionProviderContext,
	options,
} from "../../src/cli"
import { argv } from "../fixtures/argv"
import {
	createBooleanCompletionCli,
	createCompletionFixture,
} from "../fixtures/completion-cases"

const { definition, fj, values } = createCompletionFixture()

test(`orders commands by declaration and uses an exact described candidate record`, async () => {
	expect((await fj.complete({ words: [`pr`, `cr`] })).candidates).toEqual([
		{ value: `create`, description: `create a pull request` },
	])

	expect(await values(``)).toEqual([`pr`, `view`, `checkout`])
	expect(await values()).toEqual([`pr`, `view`, `checkout`])
})

test(`uses exact option occurrence records for aliases and grouped flags`, () => {
	const result = fj.interpret({
		words: [`-R`, `owner/repo`, `view`, `12`, `-ccc`, `--repo=second`, ``],
	})

	expect(result.options).toEqual([
		{ key: `repo`, index: 0, valueIndex: 1, value: `owner/repo` },
		{ key: `count`, index: 4, value: `,,` },
		{ key: `repo`, index: 5, value: `second` },
	])
})

test(`orders positional choices as declared`, async () => {
	expect(await values(`view`, `1`)).toEqual([`12`, `123`])
})

test(`keeps positional choice order after the delimiter`, async () => {
	expect(await values(`view`, `--`, `1`)).toEqual([`12`, `123`])
})

test(`uses the exact replacement record shape for an earlier word`, async () => {
	const result = await fj.complete({
		words: [`pr`, `list`, `--state=clutter`, `--title`, `ignored`],
		cursor: { word: 2, offset: 10 },
	})

	expect(result.context.replacement).toEqual({ word: 2, start: 8, end: 15 })
})

test(`omits extra fields from a scalar provider candidate`, async () => {
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

test(`uses the exact candidate record returned by a contextual provider`, async () => {
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

test(`uses the provider error message verbatim as a diagnostic`, async () => {
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

test(`orders Arktype choices and includes an empty command description`, async () => {
	const probe = createBooleanCompletionCli()
	expect(
		(await probe.complete({ words: [`run`, `--state=o`] })).candidates,
	).toEqual([{ value: `off` }, { value: `on` }])

	expect(
		(await probe.complete({ words: [`--enabled`, `r`] })).candidates,
	).toEqual([{ value: `run`, description: `` }])
})

test(`uses the exact converted invocation input record`, () => {
	const words = [`-R`, `owner/repo`, `pr`, `create`, `--count`, `-1`]
	expect(fj(argv(...words)).inputs).toEqual({
		case: `pr/create`,
		path: [`pr`, `create`],
		params: {},
		opts: { repo: `owner/repo`, count: -1 },
	})
})

test(`orders explicit hints as declared without extra candidate fields`, async () => {
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
