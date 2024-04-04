import * as fs from "node:fs"
import type { ZodSchema } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"

export type Serializable =
	| Readonly<{ [key: string]: Serializable }>
	| ReadonlyArray<Serializable>
	| boolean
	| number
	| string

export type ArgConfig<T extends Serializable> = {
	flag?: string
	parse: (arg: string) => T
	required: T extends undefined ? false : true
	description: string
	example: string
}

export type CliSetup<Arguments extends Record<string, Serializable>> = {
	discoverConfigPath?: () => string
	arguments: { [K in keyof Arguments]: ArgConfig<Arguments[K]> }
	argSchema: ZodSchema<Arguments>
}

function retrieveArgValue(argument: string, flag?: string): string {
	const isSwitch = argument.startsWith(`--`)
	const [f, v] = argument.split(`=`)
	let retrievedValue = v
	if (retrievedValue === undefined) {
		if (isSwitch) {
			retrievedValue = ``
		} else if (flag) {
			retrievedValue = f
				.split(``)
				.filter((s) => s === flag)
				.map(() => `,`)
				.join(``)
				.substring(1)
		}
	}
	return retrievedValue
}

export function cli<Arguments extends Record<string, Serializable>>(
	options: CliSetup<Arguments>,
	logger = {
		error: (...args: any[]) => console.error(...args),
	},
): (args: string[]) => {
	arguments: Arguments
	writeJsonSchema: (path: string) => void
} {
	return (passed = process.argv) => {
		let failedValidation = false
		let configFromFile: Arguments | undefined
		if (options.discoverConfigPath) {
			const configPath = options.discoverConfigPath()
			if (configPath) {
				const configText = fs.readFileSync(configPath, `utf-8`)
				const configFromFileJson = JSON.parse(configText)
				configFromFile = options.argSchema.parse(configFromFileJson)
			}
		}
		const argumentEntries = Object.entries(options.arguments)
		const configFromCommandLineEntries = argumentEntries
			.map((entry: [string & keyof Arguments, ArgConfig<any>]) => {
				const [key, config] = entry
				const { flag, parse, required, description, example } = config
				const argumentInstances = passed.filter(
					(arg) =>
						arg.startsWith(`--${key}`) ||
						(arg.startsWith(`-`) &&
							!arg.startsWith(`--`) &&
							arg.includes(`${flag}`)),
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
		const configFromCommandLine = options.argSchema.parse(
			Object.fromEntries(configFromCommandLineEntries),
		)
		return {
			arguments: Object.assign(configFromFile ?? {}, configFromCommandLine),
			writeJsonSchema: (path) => {
				const jsonSchema = zodToJsonSchema(options.argSchema)
				fs.writeFileSync(path, JSON.stringify(jsonSchema, null, `\t`))
			},
		}
	}
}
