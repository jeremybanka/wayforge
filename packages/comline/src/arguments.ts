import type { CommandLineInterface, OptionsGroup } from "./cli"
import type { CompletionHints } from "./completion"
import { matchRoute, type RouteMatch } from "./retrieve-positional-args"
import {
	type JsonSchema,
	type OptionsSchema,
	retrieveInputJsonSchema,
} from "./schema"
import type { CliWarning } from "./warnings"

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

export function splitOptionValue(
	argument: string,
): [optionName: string, value?: string] {
	const equalsIndex = argument.indexOf(`=`)
	if (equalsIndex === -1) {
		return [argument]
	}
	return [argument.slice(0, equalsIndex), argument.slice(equalsIndex + 1)]
}

type OptionWord = {
	name: string
	inline: string | undefined
	/** Full spellings, retaining repeated short flags in Unicode code-point order. */
	tokens: string[]
}

function classifyOptionWord(word: string): OptionWord | undefined {
	if (!word.startsWith(`-`) || word === `-` || word === `--`) return
	const [name, inline] = splitOptionValue(word)
	return {
		name,
		inline,
		// Preserve malformed assignments such as -=value as option occurrences.
		tokens:
			name.startsWith(`--`) || name === `-`
				? [name]
				: Array.from(name.slice(1), (flag) => `-${flag}`),
	}
}

function* optionWords(
	words: readonly string[],
	consumed: ReadonlySet<number>,
): Generator<OptionWord & { index: number }> {
	for (const [index, word] of words.entries()) {
		if (word === `--`) return
		if (consumed.has(index)) continue
		const option = classifyOptionWord(word)
		if (option) yield { ...option, index }
	}
}

export function isBooleanLiteral(arg: string): boolean {
	return arg === `true` || arg === `false` || arg === `0` || arg === `1`
}

export function isKnownOptionToken(
	arg: string,
	knownOptionTokens: KnownOptionTokens,
): boolean {
	return (
		classifyOptionWord(arg)?.tokens.some((token) =>
			token.startsWith(`--`)
				? knownOptionTokens.switches.has(token)
				: knownOptionTokens.flags.has(token.slice(1)),
		) ?? false
	)
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

type ConsumptionOption = Pick<ArgumentOption, `key` | `names` | `valueKind`>
type ArgumentScan = {
	knownOptionTokens: KnownOptionTokens
	instances: Map<string, ArgumentInstance[]>
	pending: Set<string>
	consumed: Set<number>
	recognized: Set<number>
}

// Index the options once, then visit each word once per distinct route grammar.
// Equivalent route grammars share this scan; presentation metadata never participates.
function scanOptions(
	words: readonly string[],
	options: readonly ConsumptionOption[],
	knownOptionTokens = retrieveKnownOptionTokens(options),
): ArgumentScan {
	const scan: ArgumentScan = {
		knownOptionTokens,
		instances: new Map(),
		pending: new Set(),
		consumed: new Set(),
		recognized: new Set(),
	}
	const byName = new Map<string, ConsumptionOption[]>()
	for (const option of options) {
		for (const name of option.names)
			byName.set(name, [...(byName.get(name) ?? []), option])
	}
	for (const { index, name, inline, tokens } of optionWords(
		words,
		scan.consumed,
	)) {
		// Parsing aggregates repeated flags into one value; diagnostics retain each.
		for (const option of [...new Set(tokens)].flatMap(
			(token) => byName.get(token) ?? [],
		)) {
			const signature = optionSignature(option)
			const standalone = option.names.includes(name)
			let instance: ArgumentInstance
			if (inline !== undefined) {
				instance = { index, value: inline }
			} else if (
				standalone &&
				shouldConsumeNextArg(
					words[index + 1],
					option.valueKind,
					knownOptionTokens,
				)
			) {
				instance = { index, value: words[index + 1], valueIndex: index + 1 }
				scan.consumed.add(index + 1)
			} else {
				const flag = option.names
					.find((token) => !token.startsWith(`--`))
					?.slice(1)
				instance = {
					index,
					value:
						name.startsWith(`--`) || !flag
							? ``
							: retrieveRepeatedFlagValue(name, flag),
				}
				if (standalone && index === words.length - 1) scan.pending.add(signature)
			}
			let instances = scan.instances.get(signature)
			if (!instances) {
				instances = []
				scan.instances.set(signature, instances)
			}
			instances.push(instance)
			scan.recognized.add(index)
		}
	}
	return scan
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
	options: readonly Pick<ArgumentOption, `names`>[],
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
	/** Stable identity for this route/key pair, independent of presentation metadata. */
	id: string
	key: string
	names: readonly string[]
	valueKind: OptionValueKind
	description: string
	completion?: CompletionHints | undefined
	choices: readonly string[]
}

type ArgumentInvocation = RouteMatch & {
	/** Invalid options for a complete, error-free route; unfinished input has none. */
	warnings: CliWarning[]
	/** Raw occurrences for the selected route (or following variable routes), in argument order. */
	options: OptionOccurrence[]
}

export type ArgumentInterpretation = ArgumentInvocation & {
	/** Options at this route and through its following variable positionals. */
	availableOptions: ArgumentOption[]
	/** All route options, used to recognize options before a command is selected. */
	allOptions: ArgumentOption[]
	/** Options on this route or descendants still reachable from it. */
	reachableOptions: ArgumentOption[]
	/** Raw occurrences across possible routes, for unfinished command selection. */
	allOccurrences: OptionOccurrence[]
	/** Options with occurrences under their own token-consumption rules, including unselected routes. */
	suppliedOptions: ArgumentOption[]
	/** Standalone options at the end of input that can accept a following value, including optional booleans. */
	pendingOptions: ArgumentOption[]
	/** Pending options paired with the viable grammar that determines whether the next word is a value. */
	pendingOptionValues: {
		option: ArgumentOption
		knownOptionTokens: KnownOptionTokens
	}[]
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
	route: string,
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
	return Object.entries(group.optionConfigs).map(([key, config]) => {
		let choices: string[] | undefined
		return {
			id: JSON.stringify([route, key]),
			key,
			names: [
				`--${key}`,
				...(config.aliases ?? []).map((name) => `--${name}`),
				...(config.flag ? [`-${config.flag}`] : []),
			],
			valueKind:
				config.valueKind ??
				(jsonSchemaTypeIsBoolean(properties?.[key]) ? `boolean` : `value`),
			// Parsing needs only names and consumption rules. Defer presentation reads
			// and enum extraction until completion (or an interpretation consumer) asks.
			get description() {
				return config.description
			},
			get completion() {
				return config.completion
			},
			get choices() {
				return (choices ??= schemaChoices(properties?.[key]))
			},
		}
	})
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
	// Keep route alternatives intact. Only completion compares presentation metadata;
	// the scanner and selected occurrences use the consumption signature below.
	return options
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

/** Match routes and scan raw occurrences shared by invocation and completion. */
function interpretCore(
	definition: CommandLineInterface<any>,
	words: readonly string[],
): { invocation: ArgumentInvocation; completion: () => ArgumentInterpretation } {
	const schemaCache = new Map<OptionsSchema<any>, JsonSchema | undefined>()
	const groups = new Map(
		Object.entries(definition.routeOptions).map(([route, group]) => [
			route,
			describeOptions(route, group, schemaCache),
		]),
	)
	const routes: string[] = []
	function visit(route: string, tree: RouteMatch[`tree`]): void {
		routes.push(route)
		for (const [name, child] of Object.entries(tree?.[1] ?? {}))
			visit([route, name].filter(Boolean).join(`/`), child)
	}
	visit(``, definition.routes ?? null)
	const scans = new Map<string, ArgumentScan>()
	const interpretations = routes.map((route) => {
		const options = groups.get(route) ?? []
		const grammar = JSON.stringify(options.map(optionSignature).sort())
		let scan = scans.get(grammar)
		if (!scan) {
			scan = scanOptions(words, options)
			scans.set(grammar, scan)
		}
		let positionalOnly = false
		const positionals = words.filter((word, index) => {
			if (positionalOnly) return true
			if (word === `--`) {
				positionalOnly = true
				return false
			}
			return !scan.consumed.has(index) && !word.startsWith(`-`)
		})
		const match: RouteMatch = definition.routes
			? matchRoute(definition.cliName, definition.routes, positionals)
			: { path: [], route: ``, tree: null, complete: true }
		return { route, scan, match, positionalOnly }
	})
	// Retain a route only when its own consumption rules lead toward that route.
	// Recognized options disambiguate alternatives with unrelated flags/aliases.
	const viable = interpretations.filter(
		({ route, match }) =>
			!match.error &&
			(route === match.route ||
				!match.route ||
				route.startsWith(`${match.route}/`)),
	)
	const pool = viable.length ? viable : interpretations
	const recognized = Math.max(...pool.map(({ scan }) => scan.recognized.size))
	const alternatives = pool.filter(
		({ scan }) => scan.recognized.size === recognized,
	)
	const best = alternatives.toSorted(
		(a, b) => b.match.path.length - a.match.path.length,
	)[0]
	const match = { ...best.match }
	if (!viable.length && !match.error)
		match.error = `Arguments do not match a viable route for ${definition.cliName}.`
	if (
		viable.length &&
		new Set(
			alternatives.map((alternative) => JSON.stringify(alternative.match.path)),
		).size > 1
	) {
		match.error = `Ambiguous option consumption for ${definition.cliName}. Use --option=value or -- to make the command boundary explicit.`
		match.complete = false
	}
	const activeScans = [...new Set(alternatives.map(({ scan }) => scan))]
	const occurrences = (
		options: readonly ArgumentOption[],
		applicableScans: readonly ArgumentScan[],
	): OptionOccurrence[] => {
		const unique = new Map<string, OptionOccurrence>()
		for (const option of options) {
			for (const scan of applicableScans) {
				for (const instance of scan.instances.get(optionSignature(option)) ??
					[]) {
					const occurrence = { ...instance, key: option.key }
					unique.set(JSON.stringify(occurrence), occurrence)
				}
			}
		}
		return [...unique.values()].sort((a, b) => a.index - b.index)
	}
	const selectedOptions = groups.get(match.route)
	// Alternative grammars help select an unfinished route, but cannot erase
	// occurrences belonging to the route that ordinary invocation will execute.
	const selectedScan = interpretations.find(
		({ route }) => route === match.route,
	)!.scan
	const invocation: ArgumentInvocation = {
		...match,
		warnings: selectedOptions
			? collectWarnings(
					definition.cliName,
					words,
					match,
					() => retrieveKnownOptionTokens([...groups.values()].flat()),
					selectedScan.knownOptionTokens,
					selectedScan.consumed,
				)
			: [],
		options: occurrences(
			selectedOptions ?? availableOptions(groups, match),
			selectedOptions ? [selectedScan] : activeScans,
		),
	}
	return {
		invocation,
		// Ordinary parsing never calls this view: it needs only the selected route
		// and occurrences, not flattened metadata or state across possible routes.
		completion: () => {
			const allOptions = [...groups.values()].flat()
			const pendingOptionValues = alternatives.flatMap(({ route, scan }) =>
				(groups.get(route) ?? [])
					.filter((option) => scan.pending.has(optionSignature(option)))
					.map((option) => ({
						option,
						knownOptionTokens: scan.knownOptionTokens,
					})),
			)
			return {
				...invocation,
				availableOptions: availableOptions(groups, match),
				allOptions,
				reachableOptions: reachableOptions(groups, match),
				allOccurrences: occurrences(allOptions, activeScans),
				suppliedOptions: allOptions.filter((option) =>
					activeScans.some((scan) =>
						scan.instances.has(optionSignature(option)),
					),
				),
				pendingOptions: pendingOptionValues.map(({ option }) => option),
				pendingOptionValues,
				positionalOnly: best.positionalOnly,
			}
		},
	}
}

/** Interpret executable input without constructing the completion view. */
export function interpretInvocation(
	definition: CommandLineInterface<any>,
	words: readonly string[],
): ArgumentInvocation {
	return interpretCore(definition, words).invocation
}

/** Interpret argument words without discovering config, converting values, or validating schemas. */
export function interpretArguments(
	definition: CommandLineInterface<any>,
	words: readonly string[],
): ArgumentInterpretation {
	return interpretCore(definition, words).completion()
}

function quoteDiagnosticText(text: string): string {
	// JSON quoting handles quotes, backslashes, and C0 controls. Also escape C1,
	// Unicode line separators, and formatting controls such as bidi overrides.
	return JSON.stringify(text).replace(
		/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu,
		(character) => `\\u{${character.codePointAt(0)!.toString(16)}}`,
	)
}

function collectWarnings(
	cliName: string,
	words: readonly string[],
	match: RouteMatch,
	getKnownTokens: () => KnownOptionTokens,
	selected: KnownOptionTokens,
	consumed: ReadonlySet<number>,
): CliWarning[] {
	// Descendant grammars may still supply options and consume values until the
	// route is complete. Do not diagnose those words against an unfinished route.
	if (!match.complete || match.error) return []
	const warnings: CliWarning[] = []
	let known: KnownOptionTokens | undefined
	const command = quoteDiagnosticText([cliName, ...match.path].join(` `))
	for (const { index, tokens } of optionWords(words, consumed)) {
		for (const option of tokens) {
			const isLong = option.startsWith(`--`)
			const token = isLong ? option : option.slice(1)
			const selectedTokens = isLong ? selected.switches : selected.flags
			if (selectedTokens.has(token)) continue
			known ??= getKnownTokens()
			const knownTokens = isLong ? known.switches : known.flags
			const code = knownTokens.has(token)
				? `option-not-valid-for-route`
				: `unknown-option`
			warnings.push({
				code,
				message:
					code === `unknown-option`
						? `Unknown option ${quoteDiagnosticText(option)} for command ${command}.`
						: `Option ${quoteDiagnosticText(option)} is not valid for command ${command}.`,
				option,
				index,
				cliName,
				route: match.route,
				path: [...match.path],
			})
		}
	}
	return warnings
}

/** Cache only token consumption; never use this signature to discard completion metadata. */
function optionSignature(option: ConsumptionOption): string {
	return JSON.stringify([option.key, option.names, option.valueKind])
}
