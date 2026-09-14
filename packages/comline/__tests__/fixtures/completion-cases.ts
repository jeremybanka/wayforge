import { type } from "arktype"
import { optional, required } from "treetrunks"
import z from "zod"

import {
	cli,
	options,
	parseBooleanOption,
	parseNumberOption,
} from "../../src/cli"

export function createCompletionFixture() {
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
			repo: {
				description: `repository`,
				example: ``,
				required: false,
				flag: `R`,
			},
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
	return { shared, definition, fj, values }
}

export function createBooleanCompletionCli() {
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
	return probe
}
