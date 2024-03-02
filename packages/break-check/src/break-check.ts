import logger from "npmlog"
import main from "./lib"

// Example usage
// node bin/break-check.js --pattern="*__public.test.ts" --testCommand="npm run test" --tagPattern="my-lib-v.*"

type Arg = {
	shorthand: string
	required: boolean
	description: string
	example: string
}

const ARGS = {
	testPattern: {
		shorthand: `t`,
		required: true,
		description: `The pattern to match test files that test the public API of the library.`,
		example: `--pattern=\"*__public.test.ts\"`,
	},
	testCommand: {
		shorthand: `c`,
		required: true,
		description: `Complete bash command that runs the tests for the library's public API.`,
		example: `--testCommand=\"npm run test\"`,
	},
	tagPattern: {
		shorthand: `p`,
		required: true,
		description: `String which, if found in a git tag, will be considered a release tag for your library.`,
		example: `--tagPattern=\"my-lib-v.*\"`,
	},
} satisfies Record<string, Arg>

function cli<T extends Record<string, Arg>, A extends keyof T>(args: T) {
	return {
		parse: (
			passed: string[] = process.argv,
		): {
			[K in A]: T[K] extends { required: true } ? string : string | null
		} => {
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

const { testPattern, testCommand, tagPattern } = cli(ARGS).parse(process.argv)
main(testPattern, testCommand, tagPattern)
