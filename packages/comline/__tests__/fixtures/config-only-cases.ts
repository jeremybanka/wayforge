import { type } from "arktype"
import z from "zod"

import { options, parseBooleanOption, parseNumberOption } from "../../src/cli"

export type Transition = { previousVersion: string; version: string }
export type Resolver = (version: string) => Transition | Promise<Transition>
export type Policy = (transition: Transition) => boolean

const zodFields = {
	verbose: z.boolean().default(false),
	mode: z.enum([`safe`, `fast`]).default(`safe`),
	count: z.number().default(1),
	label: z.string().optional(),
}
export const zodHookSchema = z.strictObject({
	...zodFields,
	release: z.strictObject({
		resolveDelta: z.custom<Resolver>((value) => typeof value === `function`),
		policy: z.custom<Policy>((value) => typeof value === `function`),
	}),
	secret: z.string(),
	created: z.date(),
})

export const zodHookOptions = options(`Hook configuration`, zodHookSchema, {
	verbose: {
		description: `Verbose output`,
		example: `--verbose`,
		required: false,
		parse: parseBooleanOption,
		schema: zodFields.verbose,
	},
	mode: {
		description: `Run mode`,
		example: `--mode=safe`,
		required: false,
		schema: zodFields.mode,
		parse: (value) => zodFields.mode.parse(value),
	},
	count: {
		description: `Run count`,
		example: `--count=2`,
		required: false,
		parse: parseNumberOption,
		schema: zodFields.count,
	},
	label: {
		description: `Run label`,
		example: `--label=test`,
		required: false,
		schema: zodFields.label,
	},
	release: { configOnly: true },
	secret: { configOnly: true },
	created: { configOnly: true },
})

const arkFields = {
	verbose: type(`boolean`).default(false),
	mode: type(`'safe' | 'fast'`).default(`safe`),
	count: type(`number`).default(1),
}
export const arkHookSchema = type({
	"+": `reject`,
	...arkFields,
	"label?": `string`,
	release: {
		"+": `reject`,
		resolveDelta: type(`Function`).narrow(
			(value): value is Resolver => typeof value === `function`,
		),
		policy: type(`Function`).narrow(
			(value): value is Policy => typeof value === `function`,
		),
	},
	secret: `string`,
	created: `Date`,
})

export const arkHookOptions = options(`Hook configuration`, arkHookSchema, {
	verbose: {
		description: `Verbose output`,
		example: `--verbose`,
		required: false,
		parse: parseBooleanOption,
		schema: type(`boolean`),
	},
	mode: {
		description: `Run mode`,
		example: `--mode=safe`,
		required: false,
		schema: type(`'safe' | 'fast'`),
		parse: (value) => type(`'safe' | 'fast'`).assert(value),
	},
	count: {
		description: `Run count`,
		example: `--count=2`,
		required: false,
		parse: parseNumberOption,
		schema: type(`number`),
	},
	label: {
		description: `Run label`,
		example: `--label=test`,
		required: false,
		schema: type(`string`),
	},
	release: { configOnly: true },
	secret: { configOnly: true },
	created: { configOnly: true },
})

export const hookCases = [
	{ name: `Zod`, group: zodHookOptions },
	{ name: `Arktype`, group: arkHookOptions },
]
