import * as fs from "node:fs"
import * as path from "node:path"

import type { ZodSchema } from "zod"
import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"

import type { Flag } from "./flag"
import { parseStringOption } from "./option-parsers"
import { retrievePositionalArgs } from "./retrieve-positional-args"
import type { Flat, ToPath, Tree, TreeMap, TreePath } from "./tree"

export * from "./encapsulate"
export * from "./flag"
export * from "./option-parsers"
export * from "./tree"

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

export type CliParseOutput<CLI extends CommandLineInterface<any>> = Flat<
	Readonly<{
		[K in keyof CLI[`routeOptions`]]: K extends string
			? Readonly<{
					case: K
					path: ToPath<K, `/`>
					opts: CLI[`routeOptions`][K] extends { optionsSchema: any }
						? z.infer<CLI[`routeOptions`][K][`optionsSchema`]>
						: null
				}>
			: never
	}>[keyof CLI[`routeOptions`]]
>

export type OptionsGroup<Options extends Record<string, CliOptionValue> | null> =
	Options extends Record<string, CliOptionValue>
		? {
				options: { [K in keyof Options]: CliOption<Options[K]> }
				optionsSchema: ZodSchema<Options>
			}
		: null

export type CommandLineInterface<PositionalArgTree extends Tree> = {
	cliName: string
	routes?: PositionalArgTree
	routeOptions: TreeMap<PositionalArgTree, OptionsGroup<any>>
	discoverConfigPath?: (
		positionalArgs: TreePath<PositionalArgTree>,
	) => string | undefined
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

export function cli<
	PositionalArgs extends Tree,
	CLI extends CommandLineInterface<PositionalArgs>,
>(
	{
		cliName,
		routes,
		routeOptions,
		discoverConfigPath = () =>
			path.join(process.cwd(), `${cliName}.config.json`),
	}: CLI,
	logger = {
		error: (...args: any[]) => {
			console.error(...args)
		},
	},
): (args: string[]) => {
	inputs: CliParseOutput<CLI>
	writeJsonSchema: (path: string) => void
} {
	return (passed = process.argv) => {
		type Options = CLI[`routeOptions`][keyof CLI[`routeOptions`]]

		let failedValidation = false
		let optionsFromConfig: Options | undefined
		const positionalArgs = routes
			? retrievePositionalArgs(cliName, routes, passed)
			: { path: [] as TreePath<PositionalArgs>, route: `` }

		const route: OptionsGroup<any> = routeOptions[positionalArgs.route]

		// if (route === null) {

		// }
		// console.log({ routeOptions, positionalArgs, options, optionsSchema })

		const options = route?.options ?? {}
		const optionsSchema = route?.optionsSchema ?? z.object({})

		if (route === undefined) {
			throw new Error(
				`Could not find options for route "${positionalArgs.route}". Valid routes are: \n\t- ${Object.keys(routeOptions).join(`\n\t- `)}`,
			)
		}

		if (discoverConfigPath) {
			const configFilePath = discoverConfigPath(positionalArgs.path)
			if (configFilePath) {
				if (fs.existsSync(configFilePath)) {
					const configText = fs.readFileSync(configFilePath, `utf-8`)
					const optionsFromConfigJson = JSON.parse(configText)
					optionsFromConfig = optionsSchema.parse(optionsFromConfigJson)
				}
			}
		}
		const argumentEntries = Object.entries(options)
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
							logger.error(
								`parsing`,
								key,
								`\n\t[Required]: ${description}\n\tExample usage: ${example}`,
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
		const suppliedOptions = optionsSchema.parse(suppliedOptionsUnparsed)
		return {
			inputs: {
				case: positionalArgs.route,
				path: positionalArgs.path,
				opts: suppliedOptions,
			} as unknown as CliParseOutput<CLI>,
			writeJsonSchema: (filepath) => {
				const jsonSchema = zodToJsonSchema(optionsSchema)
				fs.writeFileSync(filepath, JSON.stringify(jsonSchema, null, `\t`))
			},
		}
	}
}
