import {
	type ArgumentInterpretation,
	type ArgumentOption,
	interpretArguments,
	retrieveKnownOptionTokens,
	shouldConsumeNextArg,
	splitOptionValue,
} from "./arguments"
import type { CommandLineInterface } from "./cli"
import { deduplicateOptions, optionChoices } from "./option-metadata"

export type CompletionCandidate = {
	/** Unescaped replacement text. Shell adapters are responsible for quoting. */
	value: string
	description?: string
	appendSpace?: boolean
}

export type CompletionHints = {
	/** Overrides choices inferred from enum/const schemas or boolean options. */
	choices?: readonly (string | CompletionCandidate)[]
	fileSystem?: `none` | `files` | `directories`
	appendSpace?: boolean
	/** False hides an already supplied option. Defaults to true, including scalars. */
	repeatable?: boolean
	/** Invoked only by complete(), never by interpretation or ordinary parsing. */
	provide?: (
		context: CompletionProviderContext,
	) =>
		| readonly (string | CompletionCandidate)[]
		| Promise<readonly (string | CompletionCandidate)[]>
}

export type CompletionRequest = {
	/** Shell-tokenized words excluding the executable. Include "" after a trailing space. */
	words: readonly string[]
	/** Defaults to the end of the last word. Offsets count UTF-16 code units. */
	cursor?: { word: number; offset: number }
	signal?: AbortSignal
}

export type CompletionTarget =
	| { kind: `option-value`; option: ArgumentOption }
	| { kind: `positional`; name: string; route: string }
	| { kind: `command` }
	| { kind: `option-name` }

export type CompletionContext = ArgumentInterpretation & {
	/** Only words before the cursor participate in interpretation. */
	words: readonly string[]
	prefix: string
	/** Replace this range in one unescaped word; retain text outside the range. */
	replacement: { word: number; start: number; end: number }
	/** Multiple targets are possible, e.g. an optional boolean value or a command. */
	targets: CompletionTarget[]
}

export type CompletionProviderContext = CompletionContext & {
	target: CompletionTarget
	signal?: AbortSignal
}

export type CompletionResult = {
	context: CompletionContext
	candidates: CompletionCandidate[]
	/** Union of target hints: files takes precedence over directories, then none. */
	fileSystem: `none` | `files` | `directories`
	/** False if any target requests no space; individual candidates may override it. */
	appendSpace: boolean
	/** Invalid preceding arguments or provider failures; adapters decide how to report them. */
	diagnostics: string[]
}

function optionMatches(
	context: ArgumentInterpretation,
	name: string,
): ArgumentOption[] {
	const local = context.availableOptions.filter((option) =>
		option.names.includes(name),
	)
	const matches = local.length
		? local
		: context.reachableOptions.filter((option) => option.names.includes(name))
	return deduplicateOptions(matches)
}

/** Interpret an unfinished command line without executing providers or option parsers. */
export function interpretCompletion(
	definition: CommandLineInterface<any>,
	request: CompletionRequest,
): CompletionContext {
	const words = request.words.length ? request.words : [``]
	const cursor = request.cursor ?? {
		word: words.length - 1,
		offset: words.at(-1)!.length,
	}
	if (
		!Number.isInteger(cursor.word) ||
		!Number.isInteger(cursor.offset) ||
		cursor.word < 0 ||
		cursor.word >= words.length ||
		cursor.offset < 0 ||
		cursor.offset > words[cursor.word].length
	) {
		throw new RangeError(`Completion cursor must point inside an argument word.`)
	}
	const completed = words.slice(0, cursor.word)
	const prefix = words[cursor.word].slice(0, cursor.offset)
	const interpretation = interpretArguments(definition, completed)
	const context: CompletionContext = {
		...interpretation,
		availableOptions: deduplicateOptions(interpretation.availableOptions),
		words: [...completed, prefix],
		prefix,
		replacement: { word: cursor.word, start: 0, end: words[cursor.word].length },
		targets: [],
	}
	if (context.error) return context
	if (!context.positionalOnly) {
		const last = completed.at(-1)
		const knownOptionTokens = retrieveKnownOptionTokens(context.allOptions)
		// Only a bare, standalone option can consume a separate value. Grouped flags cannot.
		for (const option of last ? optionMatches(context, last) : []) {
			if (
				option.valueKind === `value` &&
				shouldConsumeNextArg(prefix, option.valueKind, knownOptionTokens)
			) {
				context.targets.push({ kind: `option-value`, option })
			} else if (
				option.valueKind === `boolean` &&
				[`true`, `false`, `0`, `1`].some((value) => value.startsWith(prefix))
			) {
				context.targets.push({ kind: `option-value`, option })
			}
		}
		if (
			context.targets.some(
				(target) =>
					target.kind === `option-value` && target.option.valueKind === `value`,
			)
		)
			return context
		if (prefix.startsWith(`-`)) {
			const [name, value] = splitOptionValue(prefix)
			if (value !== undefined) {
				context.prefix = value
				context.replacement.start = name.length + 1
				let matches = optionMatches(context, name)
				if (!name.startsWith(`--`) && name.length > 2) {
					// Inline values apply to every flag, just as in normal invocation.
					matches = deduplicateOptions(
						[...new Set(name.slice(1))].flatMap((flag) =>
							optionMatches(context, `-${flag}`),
						),
					)
				}
				context.targets.push(
					...matches.map((option): CompletionTarget => ({
						kind: `option-value`,
						option,
					})),
				)
			} else {
				context.targets.push({ kind: `option-name` })
			}
			return context
		}
	}
	if (context.tree) {
		context.targets.push({ kind: `command` })
		const name = Object.keys(context.tree[1]).find((key) => key.startsWith(`$`))
		if (name) {
			context.targets.push({
				kind: `positional`,
				name,
				route: [context.route, name].filter(Boolean).join(`/`),
			})
		}
	}
	return context
}

function candidate(value: string | CompletionCandidate): CompletionCandidate {
	return typeof value === `string` ? { value } : value
}

/** Generate shell-neutral suggestions. Dynamic providers are opt-in via completion hints. */
export async function complete(
	definition: CommandLineInterface<any>,
	request: CompletionRequest,
): Promise<CompletionResult> {
	const context = interpretCompletion(definition, request)
	const result: CompletionResult = {
		context,
		candidates: [],
		fileSystem: `none`,
		appendSpace: true,
		diagnostics: context.error ? [context.error] : [],
	}
	if (context.error || request.signal?.aborted) return result
	const candidates = new Map<
		string,
		CompletionCandidate & { appendSpace: boolean }
	>()
	for (const target of context.targets) {
		let hints: CompletionHints | undefined
		let choices: readonly (string | CompletionCandidate)[] = []
		if (target.kind === `option-name`) {
			choices = deduplicateOptions(context.reachableOptions)
				.filter(
					(option) =>
						option.completion?.repeatable !== false ||
						!context.suppliedOptions.includes(option),
				)
				.flatMap((option) =>
					option.names.map((value) => ({
						value,
						description: option.description,
					})),
				)
		} else if (target.kind === `command`) {
			choices = Object.keys(context.tree?.[1] ?? {})
				.filter((name) => !name.startsWith(`$`))
				.map((value) => ({
					value,
					description:
						definition.routeOptions[
							[context.route, value].filter(Boolean).join(`/`)
						]?.description ?? ``,
				}))
		} else if (target.kind === `option-value`) {
			hints = target.option.completion
			choices = optionChoices(target.option)
		} else {
			hints = definition.positionalCompletions?.[target.route]
			choices = hints?.choices ?? []
		}
		// Preserve the union of filesystem possibilities across ambiguous targets.
		if (
			hints?.fileSystem === `files` ||
			(hints?.fileSystem === `directories` && result.fileSystem === `none`)
		) {
			result.fileSystem = hints.fileSystem
		}
		const appendSpace = hints?.appendSpace ?? true
		result.appendSpace &&= appendSpace
		const addCandidates = (
			values: readonly (string | CompletionCandidate)[],
		): void => {
			for (const value of values) {
				const item = candidate(value)
				if (!item.value.startsWith(context.prefix)) continue
				const previous = candidates.get(item.value)
				candidates.set(item.value, {
					...(previous ?? item),
					appendSpace:
						(previous?.appendSpace ?? true) && (item.appendSpace ?? appendSpace),
				})
			}
		}
		addCandidates(choices)
		if (hints?.provide) {
			try {
				const values = await hints.provide({
					...context,
					target,
					...(request.signal ? { signal: request.signal } : {}),
				})
				addCandidates(values)
			} catch (error) {
				result.diagnostics.push(
					error instanceof Error ? error.message : `Completion provider failed.`,
				)
			}
		}
		if (request.signal?.aborted)
			return { ...result, candidates: [], fileSystem: `none` }
	}
	result.candidates = [...candidates.values()].map(({ appendSpace, ...item }) =>
		appendSpace === result.appendSpace ? item : { ...item, appendSpace },
	)
	return result
}
