import type { CommandLineInterface, OptionsGroup } from "./cli"
import type { CompletionHints } from "./completion"
import { matchRoute, type RouteMatch } from "./retrieve-positional-args"
import {
	type JsonSchema,
	type OptionsSchema,
	retrieveInputJsonSchema,
} from "./schema"

export type ArgumentInstance = {
	index: number
	value: string
	valueIndex?: number
}

export type OptionValueKind = `boolean` | `value`

export type KnownOptionTokens = {
	flags: ReadonlySet<string>
	switches: ReadonlySet<string>
}

type RetrieveArgumentInstancesOptions = {
	knownOptionTokens?: KnownOptionTokens
	valueKind?: OptionValueKind
	aliases?: readonly string[]
}

export function splitOptionValue(
	argument: string,
): [optionName: string, value?: string] {
	const equalsIndex = argument.indexOf(`=`)
	if (equalsIndex === -1) {
		return [argument]
	}
	return [argument.slice(0, equalsIndex), argument.slice(equalsIndex + 1)]
}

export function isBooleanLiteral(arg: string): boolean {
	return arg === `true` || arg === `false` || arg === `0` || arg === `1`
}

export function isKnownOptionToken(
	arg: string,
	knownOptionTokens: KnownOptionTokens,
): boolean {
	if (!arg.startsWith(`-`)) {
		return false
	}
	const [optionName] = splitOptionValue(arg)
	if (optionName.startsWith(`--`)) {
		return knownOptionTokens.switches.has(optionName)
	}
	return optionName
		.slice(1)
		.split(``)
		.some((flag) => knownOptionTokens.flags.has(flag))
}

export function shouldConsumeNextArg(
	arg: string | undefined,
	valueKind: OptionValueKind,
	knownOptionTokens: KnownOptionTokens,
): arg is string {
	if (arg === undefined || arg === `--`) {
		return false
	}
	if (valueKind === `boolean`) {
		return isBooleanLiteral(arg)
	}
	return !isKnownOptionToken(arg, knownOptionTokens)
}

function retrieveRepeatedFlagValue(argument: string, flag: string): string {
	return argument
		.split(``)
		.filter((s) => s === flag)
		.map(() => `,`)
		.join(``)
		.substring(1)
}

export function retrieveArgumentInstances(
	passed: readonly string[],
	key: string,
	flag?: string,
	retrieveOptions: RetrieveArgumentInstancesOptions = {},
): ArgumentInstance[] {
	const {
		knownOptionTokens = {
			flags: new Set<string>(),
			switches: new Set<string>(),
		},
		valueKind = `value`,
		aliases = [],
	} = retrieveOptions
	const instances: ArgumentInstance[] = []
	const switchNames = [key, ...aliases].map((name) => `--${name}`)
	for (const [index, argument] of passed.entries()) {
		if (argument === `--`) {
			break
		}
		if (switchNames.includes(argument)) {
			const nextArg = passed[index + 1]
			if (shouldConsumeNextArg(nextArg, valueKind, knownOptionTokens)) {
				instances.push({ index, value: nextArg, valueIndex: index + 1 })
			} else {
				instances.push({ index, value: `` })
			}
			continue
		}
		const inlineName = switchNames.find((name) =>
			argument.startsWith(`${name}=`),
		)
		if (inlineName) {
			instances.push({ index, value: argument.slice(inlineName.length + 1) })
			continue
		}
		if (
			flag === undefined ||
			!argument.startsWith(`-`) ||
			argument.startsWith(`--`)
		) {
			continue
		}
		const [flagGroup, value] = splitOptionValue(argument)
		if (!flagGroup.includes(flag)) {
			continue
		}
		if (value !== undefined) {
			instances.push({ index, value })
			continue
		}
		if (flagGroup === `-${flag}`) {
			const nextArg = passed[index + 1]
			if (shouldConsumeNextArg(nextArg, valueKind, knownOptionTokens)) {
				instances.push({ index, value: nextArg, valueIndex: index + 1 })
				continue
			}
		}
		instances.push({ index, value: retrieveRepeatedFlagValue(flagGroup, flag) })
	}
	return instances
}

function jsonSchemaTypeIsBoolean(jsonSchema: JsonSchema | undefined): boolean {
	if (jsonSchema === undefined || !(`type` in jsonSchema)) {
		return false
	}
	const { type } = jsonSchema
	if (typeof type === `string`) {
		return type === `boolean`
	}
	return type.length > 0 && type.every((t) => t === `boolean`)
}

export function retrieveKnownOptionTokens(
	options: readonly ArgumentOption[],
): KnownOptionTokens {
	return {
		switches: new Set(
			options.flatMap((option) =>
				option.names.filter((name) => name.startsWith(`--`)),
			),
		),
		flags: new Set(
			options.flatMap((option) =>
				option.names
					.filter((name) => !name.startsWith(`--`))
					.map((name) => name.slice(1)),
			),
		),
	}
}

/** One occurrence before value conversion, including repeated and grouped flags. */
export type OptionOccurrence = ArgumentInstance & { key: string }

export type ArgumentOption = {
	key: string
	names: readonly string[]
	valueKind: OptionValueKind
	description: string
	completion?: CompletionHints
	choices: readonly string[]
}

export type ArgumentInterpretation = RouteMatch & {
	/** Raw occurrences for the selected route (or following variable routes), in argument order. */
	options: OptionOccurrence[]
	/** Options at this route and through its following variable positionals. */
	availableOptions: ArgumentOption[]
	/** All route options, used to recognize options before a command is selected. */
	allOptions: ArgumentOption[]
	/** Options on this route or descendants still reachable from it. */
	reachableOptions: ArgumentOption[]
	/** Raw occurrences across possible routes, for unfinished command selection. */
	allOccurrences: OptionOccurrence[]
	positionalOnly: boolean
}

function schemaChoices(schema: JsonSchema | undefined): string[] {
	const values =
		schema?.enum ?? (schema && `const` in schema ? [schema.const] : [])
	return values
		.filter((value) => [`string`, `number`, `boolean`].includes(typeof value))
		.map(String)
}

function describeOptions(
	group: OptionsGroup<any> | null | undefined,
	schemaCache: Map<OptionsSchema<any>, JsonSchema | undefined>,
): ArgumentOption[] {
	if (!group) return []
	if (!schemaCache.has(group.optionsSchema)) {
		let schema: JsonSchema | undefined
		try {
			schema = retrieveInputJsonSchema(group.optionsSchema)
		} catch {}
		schemaCache.set(group.optionsSchema, schema)
	}
	const properties = schemaCache.get(group.optionsSchema)?.properties
	return Object.entries(group.optionConfigs).map(([key, config]) => ({
		key,
		names: [
			`--${key}`,
			...(config.aliases ?? []).map((name) => `--${name}`),
			...(config.flag ? [`-${config.flag}`] : []),
		],
		valueKind:
			config.valueKind ??
			(jsonSchemaTypeIsBoolean(properties?.[key]) ? `boolean` : `value`),
		description: config.description,
		...(config.completion ? { completion: config.completion } : {}),
		choices: schemaChoices(properties?.[key]),
	}))
}

function availableOptions(
	groups: ReadonlyMap<string, ArgumentOption[]>,
	match: RouteMatch,
): ArgumentOption[] {
	const options = [...(groups.get(match.route) ?? [])]
	for (const [key, child] of Object.entries(match.tree?.[1] ?? {})) {
		if (key.startsWith(`$`)) {
			options.push(
				...availableOptions(groups, {
					...match,
					route: [match.route, key].filter(Boolean).join(`/`),
					tree: child,
				}),
			)
			break
		}
	}
	return options.filter(
		(option, index) =>
			options.findIndex((candidate) => candidate.key === option.key) === index,
	)
}

function reachableOptions(
	groups: ReadonlyMap<string, ArgumentOption[]>,
	match: RouteMatch,
): ArgumentOption[] {
	return [
		...(groups.get(match.route) ?? []),
		...Object.entries(match.tree?.[1] ?? {}).flatMap(([key, tree]) =>
			reachableOptions(groups, {
				...match,
				route: [match.route, key].filter(Boolean).join(`/`),
				tree,
			}),
		),
	]
}

/** Interpret argument words without discovering config, converting values, or validating schemas. */
export function interpretArguments(
	definition: CommandLineInterface<any>,
	words: readonly string[],
): ArgumentInterpretation {
	const schemaCache = new Map<OptionsSchema<any>, JsonSchema | undefined>()
	const groups = new Map(
		Object.entries(definition.routeOptions).map(([route, group]) => [
			route,
			describeOptions(group, schemaCache),
		]),
	)
	const allOptions = [...groups.values()].flat()
	const knownOptionTokens = retrieveKnownOptionTokens(allOptions)
	const scanned = new Map<string, OptionOccurrence[]>()
	for (const option of allOptions) {
		const signature = optionSignature(option)
		if (scanned.has(signature)) continue
		const flag = option.names.find((name) => !name.startsWith(`--`))?.slice(1)
		scanned.set(
			signature,
			retrieveArgumentInstances(words, option.key, flag, {
				knownOptionTokens,
				valueKind: option.valueKind,
				aliases: option.names
					.filter((name) => name.startsWith(`--`))
					.slice(1)
					.map((name) => name.slice(2)),
			}).map((instance) => ({ ...instance, key: option.key })),
		)
	}
	const allOccurrences = [...scanned.values()]
		.flat()
		.sort((a, b) => a.index - b.index)
	const consumed = new Set(
		allOccurrences.flatMap(({ valueIndex }) =>
			valueIndex === undefined ? [] : [valueIndex],
		),
	)
	let positionalOnly = false
	const positionals = words.filter((word, index) => {
		if (positionalOnly) return true
		if (word === `--`) {
			positionalOnly = true
			return false
		}
		return !consumed.has(index) && !word.startsWith(`-`)
	})
	const match: RouteMatch = definition.routes
		? matchRoute(definition.cliName, definition.routes, positionals)
		: { path: [], route: ``, tree: null, complete: true }
	const available = availableOptions(groups, match)
	const selected = groups.get(match.route) ?? available
	const options = selected
		.flatMap((option) => scanned.get(optionSignature(option)) ?? [])
		.sort((a, b) => a.index - b.index)
	return {
		...match,
		options,
		availableOptions: available,
		allOptions,
		reachableOptions: reachableOptions(groups, match),
		allOccurrences,
		positionalOnly,
	}
}

function optionSignature(option: ArgumentOption): string {
	return JSON.stringify([option.key, option.names, option.valueKind])
}
