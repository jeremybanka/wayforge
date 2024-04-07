import * as fs from "node:fs"
import type { ZodSchema } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"

import type { Flag } from "./flag"
import type { Tree, TreePath } from "./tree"
import { retrievePositionalArgs } from "./retrieve-positional-args"

export * from "./option-parsers"
export * from "./tree"
export * from "./flag"

export type CliOptionValue =
	| Readonly<{ [key: string]: CliOptionValue }>
	| ReadonlyArray<CliOptionValue>
	| boolean
	| number
	| string
	| undefined

export type CliOption<T extends CliOptionValue> = {
	flag?: Flag
	parse: (arg: string) => T
	required: T extends undefined ? false : true
	description: string
	example: string
}

export type CommandLineInterface<
	PositionalArgTree extends Tree,
	Options extends Record<string, CliOptionValue>,
> = {
	discoverConfigPath?: (
		positionalArgs: TreePath<PositionalArgTree>,
	) => string | undefined
	positionalArgTree: PositionalArgTree
	options: { [K in keyof Options]: CliOption<Options[K]> }
	optionsSchema: ZodSchema<Options>
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
	Options extends Record<string, CliOptionValue>,
>(
	{
		positionalArgTree,
		options,
		optionsSchema,
		discoverConfigPath,
	}: CommandLineInterface<PositionalArgs, Options>,
	logger = {
		error: (...args: any[]) => console.error(...args),
	},
): (args: string[]) => {
	positionalArgs: TreePath<PositionalArgs>
	suppliedOptions: Options
	writeJsonSchema: (path: string) => void
} {
	return (passed = process.argv) => {
		let failedValidation = false
		let optionsFromConfig: Options | undefined
		const positionalArgs = retrievePositionalArgs(
			`my-cli`,
			positionalArgTree,
			passed,
		)
		if (discoverConfigPath) {
			const configFilePath = discoverConfigPath(positionalArgs)
			if (configFilePath) {
				const configText = fs.readFileSync(configFilePath, `utf-8`)
				const optionsFromConfigJson = JSON.parse(configText)
				optionsFromConfig = optionsSchema.parse(optionsFromConfigJson)
			}
		}
		const argumentEntries = Object.entries(options)
		const optionsFromCommandLineEntries = argumentEntries
			.map((entry: [string & keyof Options, CliOption<any>]) => {
				const [key, config] = entry
				const { flag, parse, required, description, example } = config
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
			positionalArgs,
			suppliedOptions,
			writeJsonSchema: (path) => {
				const jsonSchema = zodToJsonSchema(optionsSchema)
				fs.writeFileSync(path, JSON.stringify(jsonSchema, null, `\t`))
			},
		}
	}
}
