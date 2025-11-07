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
import type { ZodType } from "zod"

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

function retrieveArgValue(argument: string, flag?: string): string {
	const isSwitch = argument.startsWith(`--`)
	const [key, value] = argument.split(`=`)
	let retrievedValue = value
	if (retrievedValue === undefined) {
		if (isSwitch) {
			retrievedValue = ``
		} else if (flag) {
			retrievedValue = key
				.split(``)
				.filter((s) => s === flag)
				.map(() => `,`)
				.join(``)
				.substring(1)
		}
	}
	return retrievedValue
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
			if (routes) {
				positionalArgs = retrievePositionalArgs(cliName, routes, passed)
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
					const argumentInstances = passed.filter(
						(arg) =>
							arg.startsWith(`--${key}`) ||
							(arg.startsWith(`-`) &&
								!arg.startsWith(`--`) &&
								flag &&
								arg.split(`=`)[0].includes(flag)),
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
							const retrievedValue = retrieveArgValue(argumentInstances[0], flag)
							return [key, parse(retrievedValue)]
						}
						default: {
							const retrievedValues = argumentInstances
								.map((arg) => retrieveArgValue(arg, flag))
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
