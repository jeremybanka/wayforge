import * as fs from "node:fs"
import * as path from "node:path"

import type {
	StandardJSONSchemaV1,
	StandardSchemaV1,
} from "@standard-schema/spec"
import type {
	ExpandCaptures,
	Flatten,
	Split,
	Tree,
	TreeMap,
	TreePath,
	TreePathCaptures,
} from "treetrunks"

import { interpretInvocation, type OptionValueKind } from "./arguments"
import {
	complete,
	type CompletionContext,
	type CompletionHints,
	type CompletionRequest,
	type CompletionResult,
	interpretCompletion,
} from "./completion"
import { readConfigFile, readConfigFileAsync } from "./config-file"
import type { Flag } from "./flag"
import { parseStringOption } from "./option-parsers"
import { validateRoutes } from "./route-validation"
import {
	emptySchema,
	type OptionsSchema,
	retrieveInputJsonSchema,
	validateOptionsSchema,
} from "./schema"
import type { CliWarning } from "./warnings"

export type {
	ArgumentInterpretation,
	ArgumentOption,
	OptionOccurrence,
	OptionValueKind,
} from "./arguments"
export { interpretArguments } from "./arguments"
export * from "./completion"
export * from "./completion-transport"
export * from "./encapsulate"
export type * from "./flag"
export * from "./help"
export * from "./option-parsers"
export type { OptionsSchema } from "./schema"
export type {
	CliWarning,
	LogWarningsOptions,
	WarningFormatOptions,
} from "./warnings"
export { formatWarnings, logWarnings } from "./warnings"
export * from "treetrunks"

export type CliOptionValue =
	| Readonly<{ [key: string]: CliOptionValue }>
	| ReadonlyArray<CliOptionValue>
	| boolean
	| number
	| string
	| undefined

type CliOptionParser<
	Variant extends CliOptionValue,
	Value extends CliOptionValue,
> = Variant extends string
	? {
			parse?: (arg: string) => Value
		}
	: Variant extends boolean
		? {
				parse: (arg: string) => boolean
			}
		: {
				parse: (arg: string) => Value
			}

export type CliOption<T extends CliOptionValue> = CliOptionParser<T, T> & {
	configOnly?: false
	/** Input JSON Schema metadata for this CLI field; never used for validation. */
	schema?: StandardJSONSchemaV1<unknown, T>
	flag?: Flag
	/** Additional long option names, without leading dashes. */
	aliases?: readonly string[]
	/** Override schema-based value consumption for both parsing and completion. */
	valueKind?: OptionValueKind
	completion?: CompletionHints
	required: boolean
	description: string
	example: string
}

export type CliParseOutput<CLI extends CommandLineInterface<any>> = Flatten<
	Readonly<{
		[K in keyof CLI[`routeOptions`]]: K extends string
			? Readonly<{
					/**
					 * The matched route key, such as `"create/$itemName"` or `""` for the root route.
					 *
					 * Use it in a `switch` or `if` statement to narrow `.path`, `.params`, and `.opts` to the selected route.
					 *
					 * @example
					 * switch (inputs.case) {
					 *   case "create/$itemName": {
					 *     const [_, itemName] = inputs.path
					 *     // itemName will always be defined
					 *     break
					 *   }
					 * }
					 */
					case: K
					/**
					 * The positional arguments matched by the route, in their original order.
					 *
					 * Includes literal route segments and captured values; excludes options and their consumed values. Narrow `.case` to infer the corresponding tuple.
					 */
					// Widened keys cannot identify a single route whose captures can be expanded.
					path: string extends K
						? TreePath<CLI[`routes`]>
						: ExpandCaptures<Split<K>>
					/**
					 * The named positional captures for the matched route.
					 *
					 * `$name` contributes `name: string`, and `$...paths` contributes `paths: [string, ...string[]]`. Literal segments are omitted, and routes without captures produce `{}`.
					 *
					 * Narrow `.case` to access the captures for that route by name, independently of their positions in `.path`.
					 *
					 * @example
					 * if (inputs.case === "project/$name/add/$...paths") {
					 *   const { name, paths } = inputs.params
					 *   // name: string
					 *   // paths: [string, ...string[]]
					 * }
					 */
					params: TreePathCaptures<Split<K>>
					/**
					 * The parsed, schema-validated option values for the matched route.
					 *
					 * When configuration loading is enabled, command-line values override configuration values. The result may include defaults supplied by the schema.
					 */
					opts: CLI[`routeOptions`][K] extends OptionsGroup<infer Options>
						? Options
						: never
				}>
			: never
	}>[keyof CLI[`routeOptions`]]
>

/** A schema-validated value that can only be supplied by configuration. */
export type ConfigOnlyOption = {
	configOnly: true
	parse?: never
	flag?: never
	aliases?: never
	valueKind?: never
	completion?: never
	schema?: never
	required?: never
	description?: never
	example?: never
}

export type OptionConfig<Value> =
	| ConfigOnlyOption
	| ([Value] extends [CliOptionValue] ? CliOption<Value> : never)

export type OptionConfigs<Options> = {
	[K in keyof Options]-?: OptionConfig<Options[K]>
}

type DeclaredOptionConfig<Value, Config> = Config extends ConfigOnlyOption
	? ConfigOnlyOption
	: CliOption<Extract<Value, CliOptionValue>>

type DeclaredOptionConfigs<Options, Configs> = {
	[K in keyof Configs]: DeclaredOptionConfig<
		Options[K & keyof Options],
		Configs[K]
	>
}

type CheckedOptionConfigs<Options, Configs> = Configs &
	Record<Exclude<keyof Configs, keyof Options>, never> & {
		[K in keyof Configs]: Record<
			Exclude<keyof Configs[K], keyof ConfigOnlyOption>,
			never
		>
	}

/** The authored configuration input, before schema defaults and transformations. */
export type ConfigInput<
	Group extends { optionsSchema: OptionsSchema<any, any> },
> = StandardSchemaV1.InferInput<Group[`optionsSchema`]>

export type OptionsGroup<
	Options extends Record<string, unknown> | null,
	Input = unknown,
> =
	Options extends Record<string, unknown>
		? {
				description: string
				optionsSchema: OptionsSchema<Options, Input>
				optionConfigs: OptionConfigs<Options>
			}
		: null

export function options<
	Schema extends OptionsSchema<Record<string, unknown>, any>,
	Configs extends OptionConfigs<NoInfer<StandardSchemaV1.InferOutput<Schema>>>,
>(
	description: string,
	optionsSchema: Schema,
	optionConfigs: CheckedOptionConfigs<
		StandardSchemaV1.InferOutput<Schema>,
		Configs
	>,
): {
	description: string
	optionsSchema: Schema
	optionConfigs: DeclaredOptionConfigs<
		StandardSchemaV1.InferOutput<Schema>,
		Configs
	>
}
/** Retain explicit output type arguments for existing scalar-only declarations. */
export function options<Options extends Record<string, CliOptionValue>>(
	description: string,
	optionsSchema: OptionsSchema<Options>,
	optionConfigs: { [K in keyof Options]-?: CliOption<Options[K]> },
): {
	description: string
	optionsSchema: OptionsSchema<Options>
	optionConfigs: { [K in keyof Options]-?: CliOption<Options[K]> }
}
export function options(
	description: string,
	optionsSchema: OptionsSchema<any>,
	optionConfigs: OptionConfigs<any>,
): OptionsGroup<any> {
	return { description, optionsSchema, optionConfigs }
}

export type CommandLineInterface<Routes extends Tree> = {
	cliName: string
	cliDescription?: string
	/**
	 * Options for every complete route, keyed by its slash-separated declared segments.
	 *
	 * Keep capture names in the keys, such as `"show/$name"` or `"add/$...paths"`. The root route uses `""`. An optional subtree needs entries for both its parent route and its complete descendant routes. Use `noOptions()` or `null` for routes without options.
	 *
	 * @example
	 * const parse = cli({
	 *   cliName: "files",
	 *   routes: required({ remove: optional({ "$...paths": null }) }),
	 *   routeOptions: {
	 *     remove: noOptions("Choose files interactively"),
	 *     "remove/$...paths": noOptions("Remove the supplied files"),
	 *   },
	 * })
	 */
	routeOptions: TreeMap<Routes, OptionsGroup<any>>
	/**
	 * The tree of positional routes. Omit for a CLI with only the root route.
	 *
	 * Literal branch names match themselves, `$name` captures one string, and a terminal `$...name` captures one or more strings. `required()` requires continuing through a child branch; `optional()` also allows stopping at the parent. Each complete route needs an entry in `routeOptions`.
	 */
	routes?: Routes
	debugOutput?: boolean
	/** Hints keyed by full variable route names, e.g. "commit/view/$ref". */
	positionalCompletions?: Readonly<Record<string, CompletionHints>>
	/** Opt in to config loading. Return a JSON or JS/TS module path, or undefined to skip. */
	discoverConfigPath?: (positionalArgs: TreePath<Routes>) => string | undefined
}

export type CliRoutes<CLI extends CommandLineInterface<any>> = CLI[`routes`]

export type CliLogger = {
	info?: (message: string, ...data: unknown[]) => void
	error: (message: string, ...data: unknown[]) => void
}

type CliParseResult<Inputs> = {
	inputs: Inputs
	warnings: CliWarning[]
	writeJsonSchema: (outdir: string) => void
}

/**
 * Create an argument parser with the supplied routes and option schemas.
 *
 * Call the returned function with full runtime argv, such as `process.argv`. It always skips the first two entries before parsing. Its `.interpret()` and `.complete()` methods accept argument words without those runtime and executable entries; see {@link CompletionRequest} for cursor handling.
 *
 * Use `await parse.async(argv)` to load config modules with top-level await. Both entrypoints use the same synchronous discovery and schema validation.
 *
 * Successful parsing returns typed `inputs`, `warnings` for ignored options, and `writeJsonSchema`. Unknown options and options unavailable on the selected route produce warnings; use {@link logWarnings} to print them.
 *
 * Invalid route declarations throw when creating the parser. Parsing throws for invalid or incomplete routes and for option parsing, configuration, or schema validation errors.
 *
 * @example
 * const parse = cli({ cliName: "example", routeOptions: { "": noOptions() } })
 * const { inputs, warnings } = parse(process.argv)
 * const context = parse.interpret({ words: [""] })
 * const suggestions = await parse.complete({ words: [""] })
 */
export function cli<
	CLI extends CommandLineInterface<Routes>,
	Routes extends Tree = Exclude<CLI[`routes`], undefined>,
>(
	definitionInput: CLI & { routes?: Routes },
	logger: CliLogger = console,
): ((argv: readonly string[]) => CliParseResult<CliParseOutput<CLI>>) & {
	async: (
		argv: readonly string[],
	) => Promise<CliParseResult<CliParseOutput<CLI>>>
	definition: CLI
	interpret: (request: CompletionRequest) => CompletionContext
	complete: (request: CompletionRequest) => Promise<CompletionResult>
} {
	// Infer Routes directly at the call site, then retain CLI for internal consumers.
	const definition: CLI = definitionInput
	if (definition.routes) validateRoutes(definition.routes)
	const {
		cliName,
		routeOptions,
		debugOutput = false,
		discoverConfigPath,
	} = definition
	const cliLogger: CliLogger = {
		error: (message: string, ...args: unknown[]) => {
			logger.error(`[${cliName}]:`, message, ...args)
		},
	}
	if (debugOutput) {
		cliLogger.info = (message: string, ...args: unknown[]) => {
			logger.info?.(`[${cliName}]:`, message, ...args)
		}
	}

	const prepare = (
		argv: readonly string[],
	): {
		configFilePath: string | undefined
		finish: (loaded?: { value: unknown }) => CliParseResult<CliParseOutput<CLI>>
	} => {
		const passed = argv.slice(2)
		cliLogger.info?.(`passed args:`, passed)

		const interpretation = interpretInvocation(definition, passed)
		if (interpretation.error) throw new Error(interpretation.error)
		if (!interpretation.complete) {
			throw new Error(
				`${cliName} ${interpretation.path.join(` `)} requires one of the following positional arguments:\n${Object.keys(
					interpretation.tree?.[1] ?? {},
				)
					.map((name) => `\t- ${name}`)
					.join(`\n`)}`,
			)
		}

		// The shared result uses string keys for unfinished routes. After successful
		// traversal, recover the definition's key type; missing options are checked below.
		const route: OptionsGroup<any> =
			routeOptions[interpretation.route as keyof typeof routeOptions]

		const optionConfigs = route?.optionConfigs ?? {}
		const optionsSchema = route?.optionsSchema ?? emptySchema

		if (route === undefined) {
			throw new Error(
				`Could not find options for route "${interpretation.route}". Valid routes are: \n\t- ${Object.keys(routeOptions).join(`\n\t- `)}`,
			)
		}

		// Traversal has completed a declared route before discovery can run.
		let configFilePath = discoverConfigPath?.(
			interpretation.path as TreePath<Routes>,
		)
		if (configFilePath) {
			cliLogger.info?.(`looking for config file at:`, configFilePath)
			if (fs.existsSync(configFilePath)) {
				cliLogger.info?.(`config file was found`)
			} else {
				configFilePath = undefined
			}
		}
		return {
			configFilePath,
			finish: (loaded) => {
				let failedValidation = false
				const optionsFromConfig = loaded?.value
				if (loaded) {
					// Validate independently, then merge the original input so transformations
					// never receive their own output during final validation.
					validateOptionsSchema(optionsSchema, optionsFromConfig)
				}
				cliLogger.info?.(`options from config:`, optionsFromConfig)
				const argumentEntries = Object.entries(optionConfigs).filter(
					(entry): entry is [string, CliOption<any>] => !entry[1].configOnly,
				)
				const optionsFromCommandLineEntries = argumentEntries
					.map((entry: [string, CliOption<any>]) => {
						const [key, config] = entry
						const { required, description, example } = config
						const parse = `parse` in config ? config.parse : parseStringOption
						const argumentInstances = interpretation.options.filter(
							(option) => option.key === key,
						)

						switch (argumentInstances.length) {
							case 0:
								if (required && !optionsFromConfig) {
									cliLogger.error(
										`Missed:`,
										key,
										`\n\t${description} (required)\n\tExample usage:\n\t\t${example}`,
									)
									failedValidation = true
								}
								return [key, undefined]
							case 1: {
								const retrievedValue = argumentInstances[0].value
								return [key, parse(retrievedValue)]
							}
							default: {
								const retrievedValues = argumentInstances
									.map((arg) => arg.value)
									.join(`,`)
								return [key, parse(retrievedValues)]
							}
						}
					})
					.filter(([, value]) => value !== undefined)
				if (failedValidation) {
					throw new Error(
						`Some required arguments were not provided. See above for details.`,
					)
				}
				const optionsFromCommandLine = Object.fromEntries(
					optionsFromCommandLineEntries,
				)
				const suppliedOptionsUnparsed = {
					...(optionsFromConfig ?? {}),
					...optionsFromCommandLine,
				}
				cliLogger.info?.(`options from command line:`, optionsFromCommandLine)
				const suppliedOptions = validateOptionsSchema(
					optionsSchema,
					suppliedOptionsUnparsed,
				)
				cliLogger.info?.(`final options parsed:`, suppliedOptions)
				return {
					warnings: interpretation.warnings,
					inputs: {
						case: interpretation.route,
						path: interpretation.path,
						params: interpretation.params,
						opts: suppliedOptions,
					} as unknown as CliParseOutput<CLI>,
					writeJsonSchema: (outdir: string) => {
						for (const [unsafeRoute, optionsGroup] of Object.entries(
							routeOptions as Record<string, OptionsGroup<any> | null>,
						)) {
							if (optionsGroup === null) {
								continue
							}
							const safeRoute = unsafeRoute.replaceAll(`/`, `.`)
							let jsonSchema
							try {
								jsonSchema = retrieveInputJsonSchema(
									optionsGroup.optionsSchema,
									true,
								)
							} catch (cause) {
								throw new Error(
									`Cannot export full configuration JSON Schema for route "${unsafeRoute || `(root)`}". The runtime schema may contain values that JSON Schema cannot represent.`,
									{ cause },
								)
							}
							const filepath = path.resolve(
								outdir,
								`${cliName}.${safeRoute || `main`}.schema.json`,
							)
							fs.writeFileSync(filepath, JSON.stringify(jsonSchema, null, `\t`))
						}
					},
				}
			},
		}
	}
	return Object.assign(
		(argv: readonly string[]): CliParseResult<CliParseOutput<CLI>> => {
			const { configFilePath, finish } = prepare(argv)
			return finish(
				configFilePath ? { value: readConfigFile(configFilePath) } : undefined,
			)
		},
		{
			definition,
			async: async (
				argv: readonly string[],
			): Promise<CliParseResult<CliParseOutput<CLI>>> => {
				const { configFilePath, finish } = prepare(argv)
				return finish(
					configFilePath ? await readConfigFileAsync(configFilePath) : undefined,
				)
			},
			interpret: (request: CompletionRequest): CompletionContext =>
				interpretCompletion(definition, request),
			complete: (request: CompletionRequest): Promise<CompletionResult> =>
				complete(definition, request),
		},
	)
}

export function noOptions(
	description?: string,
): OptionsGroup<Record<never, never>> {
	const optionsGroup: OptionsGroup<Record<never, never>> = {
		description: ``,
		optionsSchema: emptySchema,
		optionConfigs: {},
	}
	if (description) {
		Object.assign(optionsGroup, { description })
	}
	return optionsGroup
}
