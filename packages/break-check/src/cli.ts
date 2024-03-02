export type CommandLineArg = {
	shorthand: string
	required: boolean
	description: string
	example: string
}

export function cli<T extends Record<string, CommandLineArg>, A extends keyof T>(
	args: T,
	logger = {
		error: (...args: any[]) => console.error(...args),
	},
): {
	parse: (passed: string[]) => {
		[K in A]: T[K] extends { required: true } ? string : string | null
	}
} {
	return {
		parse: (passed = process.argv) => {
			return Object.fromEntries(
				Object.entries(args).map(
					([key, { shorthand, required, description, example }]) => {
						const valueStringified = passed.find(
							(arg) =>
								arg.startsWith(`--${key}=`) || arg.startsWith(`-${shorthand}=`),
						)
						if (!valueStringified) {
							if (required) {
								logger.error(
									`parsing`,
									key,
									`\n\t[Required]: ${description}\n\tExample usage: ${key}="${example}"`,
								)
							}
							return [key, null]
						}
						return [key, valueStringified.split(`=`)[1]]
					},
				),
			) as { [K in A]: T[K] extends { required: true } ? string : string | null }
		},
	}
}
