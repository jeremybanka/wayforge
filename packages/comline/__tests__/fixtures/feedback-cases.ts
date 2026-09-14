import { optional, required } from "treetrunks"
import { vi } from "vitest"
import z from "zod"

import {
	type CompletionHints,
	options,
	parseBooleanOption,
	parseNumberOption,
} from "../../src/cli"

export function refOptions(completion: CompletionHints) {
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

export function conflictingRouteOptions() {
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

export function createDashPrefixedValueDefinition() {
	const definition = {
		cliName: `probe`,
		routeOptions: {
			"": options(
				``,
				z.object({ ref: z.string().optional(), confirm: z.string().optional() }),
				{
					ref: {
						description: ``,
						example: ``,
						required: false,
						completion: {
							choices: [`--confirm`, `--confetti`],
							provide: () => [`--confirm=value`],
						},
					},
					confirm: { description: ``, example: ``, required: false },
				},
			),
		},
	}
	return definition
}

export function createGroupedValueDefinition() {
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
	return definition
}

export function createPendingValueFixture() {
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
	return { input, definition }
}

export function createClonedHintsFixture() {
	const provide = vi.fn(() => [`main`])
	const hints: CompletionHints = {
		provide,
		choices: [{ value: `master`, description: `legacy` }],
	}
	const definition = {
		cliName: `probe`,
		routes: required({ a: null, b: null }),
		routeOptions: {
			a: refOptions(hints),
			b: refOptions({
				...hints,
				choices: [{ description: `legacy`, value: `master` }],
			}),
		},
	}
	return { provide, definition }
}

export function createDistinctProvidersFixture() {
	const a = vi.fn(() => [`alpha`])
	const b = vi.fn(() => [`beta`])
	const definition = {
		cliName: `probe`,
		routes: required({ a: null, b: null }),
		routeOptions: {
			a: refOptions({ provide: a }),
			b: refOptions({ provide: b }),
		},
	}
	return { a, b, definition }
}

export function createMixedSpacingDefinition() {
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
	const definition = {
		cliName: `probe`,
		routes: optional({ run: null, $path: null }),
		routeOptions: { "": group, run: group, $path: group },
		positionalCompletions: {
			$path: {
				choices: [`folder`],
				fileSystem: `directories` as const,
				appendSpace: true,
			},
		},
	}
	return definition
}

export function createProviderSpacingDefinition() {
	const definition = {
		cliName: `probe`,
		routeOptions: {
			"": refOptions({
				appendSpace: false,
				provide: () => [{ value: `main`, appendSpace: true }],
			}),
		},
	}
	return definition
}

export function createEarlyOptionDefinition() {
	const group = refOptions({ repeatable: false })
	const withAlias = options(group.description, group.optionsSchema, {
		ref: { ...group.optionConfigs.ref, aliases: [`reference`] },
	})
	const definition = {
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
	}
	return definition
}

export const earlyOptionCompletions = [
	{ words: [`--re`], names: [`--ref`, `--reference`] },
	{ words: [`pr`, `--re`], names: [`--ref`, `--reference`] },
	{ words: [`pr`, `-r`], names: [`-r`] },
	{ words: [`--ref`, `main`, `--re`], names: [] },
	{ words: [`pr`, `--ref=main`, `--re`], names: [] },
	{ words: [`other`, `--re`], names: [] },
]
