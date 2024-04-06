import * as fs from "node:fs"
import type { ZodSchema } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"
import type { Flag } from "./flag"

export type Serializable =
	| Readonly<{ [key: string]: Serializable }>
	| ReadonlyArray<Serializable>
	| boolean
	| number
	| string
	| undefined

export type Tree = Readonly<{ [key: string]: Tree | null }>

export type TreePath<T extends Tree> = {
	[K in keyof T]: T[K] extends Tree ? [K, ...TreePath<T[K]>] : [K]
}[keyof T]

const myTree = {
	a: {
		b: null,
		c: {
			d: null,
		},
	},
} as const

const myTreePath0: TreePath<typeof myTree> = [`a`, `c`, `d`]

export type CliOption<T extends Serializable> = {
	flag?: Flag
	parse: (arg: string) => T
	required: T extends undefined ? false : true
	description: string
	example: string
}

export type CommandLineInterface<
	Args extends Tree,
	Options extends Record<string, Serializable>,
> = {
	discoverConfigPath?: (positionalArgs: string[]) => string | undefined
	positionalArgTree?: Args
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
	Args extends Tree,
	Config extends Record<string, Serializable>,
>(
	{ options, optionsSchema, discoverConfigPath }: CommandLineInterface<Config>,
	logger = {
		error: (...args: any[]) => console.error(...args),
	},
): (args: string[]) => {
	positionalArgs: TreePath<Args, ``, ``, ``, ``, ``, ``, ``, ``, ``>
	config: Config
	writeJsonSchema: (path: string) => void
} {
	return (passed = process.argv) => {
		let failedValidation = false
		let configFromFile: Config | undefined
		if (discoverConfigPath) {
			const configPath = discoverConfigPath()
			if (configPath) {
				const configText = fs.readFileSync(configPath, `utf-8`)
				const configFromFileJson = JSON.parse(configText)
				configFromFile = optionsSchema.parse(configFromFileJson)
			}
		}
		const argumentEntries = Object.entries(options)
		const configFromCommandLineEntries = argumentEntries
			.map((entry: [string & keyof Config, CliOption<any>]) => {
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
						if (required && !configFromFile) {
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
		const configFromCommandLine = optionsSchema.parse(
			Object.fromEntries(configFromCommandLineEntries),
		)
		return {
			config: Object.assign(configFromFile ?? {}, configFromCommandLine),
			writeJsonSchema: (path) => {
				const jsonSchema = zodToJsonSchema(optionsSchema)
				fs.writeFileSync(path, JSON.stringify(jsonSchema, null, `\t`))
			},
		}
	}
}
