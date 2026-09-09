import * as fs from "node:fs"
import * as path from "node:path"

import type { Flatten, Tree, TreeMap, TreePath } from "treetrunks"

import { interpretInvocation, type OptionValueKind } from "./arguments"
import {
	complete,
	type CompletionContext,
	type CompletionHints,
	type CompletionRequest,
	type CompletionResult,
	interpretCompletion,
} from "./completion"
import type { Flag } from "./flag"
import { parseStringOption } from "./option-parsers"
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
export * from "./warnings"
export * from "treetrunks"

export type CliOptionValue =
	| Readonly<{ [key: string]: CliOptionValue }>
	| ReadonlyArray<CliOptionValue>
	| boolean
	| number
	| string
	| undefined

export type CliOption<T extends CliOptionValue> = (T extends string
	? {
			parse?: (arg: string) => T
		}
	: T extends boolean
		? {
				parse: (arg: string) => boolean
			}
		: {
				parse: (arg: string) => T
			}) & {
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
					case: K
					path: TreePath<CLI[`routes`]>
					opts: CLI[`routeOptions`][K] extends OptionsGroup<infer Options>
						? Options
						: never
				}>
			: never
	}>[keyof CLI[`routeOptions`]]
>

export type OptionsGroup<Options extends Record<string, CliOptionValue> | null> =
	Options extends Record<string, CliOptionValue>
		? {
				description: string
				optionsSchema: OptionsSchema<Options>
				optionConfigs: {
					[K in keyof Options]-?: CliOption<Options[K]>
				}
			}
		: null

export function options<Options extends Record<string, CliOptionValue>>(
	description: string,
	optionsSchema: OptionsSchema<Options>,
	optionConfigs: {
		[K in keyof Options]-?: CliOption<Options[K]>
	},
): OptionsGroup<Options> {
	return { description, optionsSchema, optionConfigs } as OptionsGroup<Options>
}

export type CommandLineInterface<Routes extends Tree> = {
	cliName: string
	cliDescription?: string
	routeOptions: TreeMap<Routes, OptionsGroup<any>>
	routes?: Routes
	debugOutput?: boolean
	/** Hints keyed by full variable route names, e.g. "commit/view/$ref". */
	positionalCompletions?: Readonly<Record<string, CompletionHints>>
	discoverConfigPath?: (positionalArgs: TreePath<Routes>) => string | undefined
}

export type CliRoutes<CLI extends CommandLineInterface<any>> = CLI[`routes`]

export type CliLogger = {
	info?: (message: string, ...data: unknown[]) => void
	error: (message: string, ...data: unknown[]) => void
}

export function cli<
	CLI extends CommandLineInterface<Routes>,
	Routes extends Tree = Exclude<CLI[`routes`], undefined>,
>(
	definition: CLI,
	logger: CliLogger = console,
): ((argv: readonly string[]) => {
	inputs: CliParseOutput<CLI>
	warnings: CliWarning[]
	writeJsonSchema: (outdir: string) => void
}) & {
	definition: CLI
	interpret: (request: CompletionRequest) => CompletionContext
	complete: (request: CompletionRequest) => Promise<CompletionResult>
} {
	const {
		cliName,
		routeOptions,
		debugOutput = false,
		discoverConfigPath = () =>
			path.join(process.cwd(), `${cliName}.config.json`),
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

	return Object.assign(
		(argv: readonly string[]) => {
			const passed = argv.slice(2)
			cliLogger.info?.(`passed args:`, passed)

			type Options = CLI[`routeOptions`][keyof CLI[`routeOptions`]]

			let failedValidation = false
			let optionsFromConfig: Options | undefined
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

			if (discoverConfigPath) {
				// Traversal validated every segment and completed the required route, or
				// returned [] when routes are absent. The shared result stays string[]
				// for completion prefixes; it does not preserve this TreePath<Routes> proof.
				const configFilePath = discoverConfigPath(
					interpretation.path as TreePath<Routes>,
				)
				if (configFilePath) {
					cliLogger.info?.(`looking for config file at:`, configFilePath)
					if (fs.existsSync(configFilePath)) {
						cliLogger.info?.(`config file was found`)
						const configText = fs.readFileSync(configFilePath, `utf-8`)
						const optionsFromConfigJson = JSON.parse(configText)
						optionsFromConfig = validateOptionsSchema(
							optionsSchema,
							optionsFromConfigJson,
						) as Options
					}
				}
			}
			cliLogger.info?.(`options from config:`, optionsFromConfig)
			const argumentEntries = Object.entries(optionConfigs)
			const optionsFromCommandLineEntries = argumentEntries
				.map((entry: [string & keyof Options, CliOption<any>]) => {
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
			const suppliedOptionsUnparsed = Object.assign(
				optionsFromConfig ?? {},
				optionsFromCommandLine,
			)
			cliLogger.info?.(`options from command line:`, optionsFromCommandLine)
			const suppliedOptions = validateOptionsSchema(
				optionsSchema,
				suppliedOptionsUnparsed,
			) as Options
			cliLogger.info?.(`final options parsed:`, suppliedOptions)
			return {
				warnings: interpretation.warnings,
				inputs: {
					case: interpretation.route,
					path: interpretation.path,
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
						const jsonSchema = retrieveInputJsonSchema(
							optionsGroup.optionsSchema,
						)
						const filepath = path.resolve(
							outdir,
							`${cliName}.${safeRoute || `main`}.schema.json`,
						)
						fs.writeFileSync(filepath, JSON.stringify(jsonSchema, null, `\t`))
					}
				},
			}
		},
		{
			definition,
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
