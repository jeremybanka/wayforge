import * as fs from "node:fs"
import * as path from "node:path"

import type { JsonSchema, Type } from "arktype"
import type {
	Flatten,
	Join,
	Tree,
	TreeMap,
	TreePath,
	TreePathName,
} from "treetrunks"
import type { ZodObject, ZodType } from "zod"

import type { Flag } from "./flag"
import { parseStringOption } from "./option-parsers"
import { retrievePositionalArgs } from "./retrieve-positional-args"
import { ark, schemaPkg, zod } from "./schema"

export * from "./encapsulate"
export type * from "./flag"
export * from "./help"
export * from "./option-parsers"
export * from "treetrunks"

const emptySchema =
	`type` in schemaPkg ? schemaPkg.type({}) : schemaPkg.z.object({})

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
	required: T extends undefined ? false : true
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
				optionsSchema: Type<Options> | ZodType<Options>
				optionConfigs: {
					[K in keyof Options]-?: CliOption<Options[K]>
				}
			}
		: null

export function options<Options extends Record<string, CliOptionValue>>(
	description: string,
	optionsSchema: Type<Options> | ZodType<Options>,
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
	discoverConfigPath?: (positionalArgs: TreePath<Routes>) => string | undefined
}

type CliOptionConfigEntry = readonly [
	key: string,
	config: CliOption<any>,
	valueKind: OptionValueKind,
]

type ArgumentInstance = {
	value: string
	valueIndex?: number
}

type OptionValueKind = `boolean` | `value`

type KnownOptionTokens = {
	flags: ReadonlySet<string>
	switches: ReadonlySet<string>
}

type RetrieveArgumentInstancesOptions = {
	knownOptionTokens?: KnownOptionTokens
	valueKind?: OptionValueKind
}

function splitOptionValue(
	argument: string,
): [optionName: string, value?: string] {
	const equalsIndex = argument.indexOf(`=`)
	if (equalsIndex === -1) {
		return [argument]
	}
	return [argument.slice(0, equalsIndex), argument.slice(equalsIndex + 1)]
}

function isBooleanLiteral(arg: string): boolean {
	return arg === `true` || arg === `false` || arg === `0` || arg === `1`
}

function isKnownOptionToken(
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

function shouldConsumeNextArg(
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

function retrieveArgumentInstances(
	passed: string[],
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
	} = retrieveOptions
	const instances: ArgumentInstance[] = []
	const switchName = `--${key}`
	const switchNameWithValue = `${switchName}=`
	for (const [index, argument] of passed.entries()) {
		if (argument === switchName) {
			const nextArg = passed[index + 1]
			if (shouldConsumeNextArg(nextArg, valueKind, knownOptionTokens)) {
				instances.push({ value: nextArg, valueIndex: index + 1 })
			} else {
				instances.push({ value: `` })
			}
			continue
		}
		if (argument.startsWith(switchNameWithValue)) {
			instances.push({ value: argument.slice(switchNameWithValue.length) })
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
			instances.push({ value })
			continue
		}
		if (flagGroup === `-${flag}`) {
			const nextArg = passed[index + 1]
			if (shouldConsumeNextArg(nextArg, valueKind, knownOptionTokens)) {
				instances.push({ value: nextArg, valueIndex: index + 1 })
				continue
			}
		}
		instances.push({ value: retrieveRepeatedFlagValue(flagGroup, flag) })
	}
	return instances
}

function retrieveZodOptionType(
	optionsSchema: ZodType<any>,
	key: string,
): string | undefined {
	const optionDef = (optionsSchema as ZodObject<any>).shape[key]?._def
	if (optionDef?.type === `optional`) {
		return optionDef.innerType._def.type
	}
	return optionDef?.type
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

function optionSchemaIsBoolean(
	optionsGroup: Exclude<OptionsGroup<any>, null>,
	key: string,
): boolean {
	const optionsSchema = optionsGroup.optionsSchema
	if (zod && optionsSchema instanceof zod.ZodType) {
		return retrieveZodOptionType(optionsSchema, key) === `boolean`
	}
	if (ark && optionsSchema instanceof ark.Type) {
		const jsonSchema = optionsSchema.toJsonSchema() as JsonSchema.Object & {
			properties?: Record<string, JsonSchema>
		}
		return jsonSchemaTypeIsBoolean(jsonSchema.properties?.[key])
	}
	return false
}

function retrieveOptionValueKind(
	optionsGroup: Exclude<OptionsGroup<any>, null>,
	key: string,
): OptionValueKind {
	return optionSchemaIsBoolean(optionsGroup, key) ? `boolean` : `value`
}

function retrieveOptionConfigEntries(
	routeOptions: Record<string, OptionsGroup<any> | null>,
): CliOptionConfigEntry[] {
	const seenOptions = new Set<string>()
	const entries: CliOptionConfigEntry[] = []
	for (const optionsGroup of Object.values(routeOptions)) {
		if (optionsGroup === null) {
			continue
		}
		for (const [key, config] of Object.entries(optionsGroup.optionConfigs)) {
			const valueKind = retrieveOptionValueKind(optionsGroup, key)
			const signature = `${key}\0${config.flag ?? ``}\0${valueKind}`
			if (seenOptions.has(signature)) {
				continue
			}
			seenOptions.add(signature)
			entries.push([key, config, valueKind])
		}
	}
	return entries
}

function retrieveKnownOptionTokens(
	optionConfigEntries: CliOptionConfigEntry[],
): KnownOptionTokens {
	const flags = new Set<string>()
	const switches = new Set<string>()
	for (const [key, config] of optionConfigEntries) {
		switches.add(`--${key}`)
		if (config.flag) {
			flags.add(config.flag)
		}
	}
	return { flags, switches }
}

function retrieveConsumedValueIndexes(
	passed: string[],
	optionConfigEntries: CliOptionConfigEntry[],
): Set<number> {
	const indexes = new Set<number>()
	const knownOptionTokens = retrieveKnownOptionTokens(optionConfigEntries)
	for (const [key, config, valueKind] of optionConfigEntries) {
		for (const argumentInstance of retrieveArgumentInstances(
			passed,
			key,
			config.flag,
			{ knownOptionTokens, valueKind },
		)) {
			if (argumentInstance.valueIndex !== undefined) {
				indexes.add(argumentInstance.valueIndex)
			}
		}
	}
	return indexes
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
): ((args: string[]) => {
	inputs: CliParseOutput<CLI>
	writeJsonSchema: (outdir: string) => void
}) & { definition: CLI } {
	const {
		cliName,
		routes,
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
		(passed = process.argv) => {
			cliLogger.info?.(`passed args:`, passed)

			type Options = CLI[`routeOptions`][keyof CLI[`routeOptions`]]

			let failedValidation = false
			let optionsFromConfig: Options | undefined
			let positionalArgs = {
				path: [] as TreePath<Routes>,
				route: `` as Join<TreePathName<Routes>>,
			}
			const allOptionConfigEntries = retrieveOptionConfigEntries(
				routeOptions as Record<string, OptionsGroup<any> | null>,
			)
			const consumedValueIndexes = retrieveConsumedValueIndexes(
				passed,
				allOptionConfigEntries,
			)
			const knownOptionTokens = retrieveKnownOptionTokens(allOptionConfigEntries)
			if (routes) {
				positionalArgs = retrievePositionalArgs(
					cliName,
					routes,
					passed,
					consumedValueIndexes,
				)
			}

			const route: OptionsGroup<any> = routeOptions[positionalArgs.route]

			const optionConfigs = route?.optionConfigs ?? {}
			const optionsSchema = route?.optionsSchema ?? emptySchema

			if (route === undefined) {
				throw new Error(
					`Could not find options for route "${positionalArgs.route}". Valid routes are: \n\t- ${Object.keys(routeOptions).join(`\n\t- `)}`,
				)
			}

			if (discoverConfigPath) {
				const configFilePath = discoverConfigPath(positionalArgs.path)
				if (configFilePath) {
					cliLogger.info?.(`looking for config file at:`, configFilePath)
					if (fs.existsSync(configFilePath)) {
						cliLogger.info?.(`config file was found`)
						const configText = fs.readFileSync(configFilePath, `utf-8`)
						const optionsFromConfigJson = JSON.parse(configText)
						if (zod && optionsSchema instanceof zod.ZodType) {
							optionsFromConfig = optionsSchema.parse(
								optionsFromConfigJson,
							) as Options
						} else if (ark && optionsSchema instanceof ark.Type) {
							optionsFromConfig = optionsSchema.assert(
								optionsFromConfigJson,
							) as Options
						}
					}
				}
			}
			cliLogger.info?.(`options from config:`, optionsFromConfig)
			const argumentEntries = Object.entries(optionConfigs)
			const optionsFromCommandLineEntries = argumentEntries
				.map((entry: [string & keyof Options, CliOption<any>]) => {
					const [key, config] = entry
					const { flag, required, description, example } = config
					const parse = `parse` in config ? config.parse : parseStringOption
					const argumentInstances = retrieveArgumentInstances(
						passed,
						key,
						flag,
						{
							knownOptionTokens,
							valueKind:
								route === null ? `value` : retrieveOptionValueKind(route, key),
						},
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
			let suppliedOptions: Options
			if (zod && optionsSchema instanceof zod.ZodType) {
				suppliedOptions = optionsSchema.parse(suppliedOptionsUnparsed) as Options
			} else if (ark && optionsSchema instanceof ark.Type) {
				suppliedOptions = optionsSchema.assert(
					suppliedOptionsUnparsed,
				) as Options
			} else {
				throw new Error(`Unreachable? Indicates no install of arktype or zod.`)
			}
			cliLogger.info?.(`final options parsed:`, suppliedOptions)
			return {
				inputs: {
					case: positionalArgs.route,
					path: positionalArgs.path,
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
						let jsonSchema: object
						if (zod && optionsGroup.optionsSchema instanceof zod.ZodType) {
							jsonSchema = zod.z.toJSONSchema(optionsGroup.optionsSchema)
						} else if (ark && optionsGroup.optionsSchema instanceof ark.Type) {
							const arktypeJsonSchema =
								optionsGroup.optionsSchema.toJsonSchema() as JsonSchema.Object
							arktypeJsonSchema.additionalProperties = false
							jsonSchema = arktypeJsonSchema
						} else {
							throw new Error(
								`Unreachable? Indicates no install of arktype or zod.`,
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
		{ definition },
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
