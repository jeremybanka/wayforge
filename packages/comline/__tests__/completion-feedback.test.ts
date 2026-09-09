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
