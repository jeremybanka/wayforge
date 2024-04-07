import { z } from "zod"

import { cli } from "../src/cli"
import { parseStringOption } from "../src/option-parsers"
import { optional, required } from "../src/tree"

describe(`positional args from cli`, () => {
	const testCli = cli({
		cliName: `my-cli`,
		positionalArgTree: required({
			hello: optional({
				world: null,
				$name: optional({ good: required({ morning: null }) }),
			}),
		}),
		optionsSchema: z.object({}),
		options: {},
	})
	test(`happy: all positional args`, () => {
		const { positionalArgs } = testCli([`--`, `hello`, `world`])
		expect(positionalArgs).toEqual([`hello`, `world`])
	})
	test(`happy: missing optional positional args`, () => {
		const { positionalArgs } = testCli([`--`, `hello`])
		expect(positionalArgs).toEqual([`hello`])
	})
	test(`error: missing required positional args`, () => {
		expect(() => testCli([`--`])).toThrow()
	})
	test(`error: extra positional args`, () => {
		expect(() => testCli([`--`, `hello`, `world`, `extra`])).toThrow()
	})
	test(`happy: variable positional args`, () => {
		const { positionalArgs } = testCli([
			`--`,
			`hello`,
			`jeff`,
			`good`,
			`morning`,
		])
		expect(positionalArgs).toEqual([`hello`, `jeff`, `good`, `morning`])
	})
})

describe(`options and positional args from cli`, () => {
	const testCli = cli({
		cliName: `my-cli`,
		positionalArgTree: optional({ yo: null }),
		optionsSchema: z.object({ foo: z.string().optional() }),
		options: {
			foo: {
				description: `foo`,
				example: `--foo=hello`,
				flag: `f`,
				parse: parseStringOption,
				required: false,
			},
		},
	})
	test(`happy: all options and positional args`, () => {
		const { suppliedOptions, positionalArgs } = testCli([
			`--foo=hello`,
			`--`,
			`yo`,
		])
		expect(suppliedOptions).toEqual({ foo: `hello` })
		expect(positionalArgs).toEqual([`yo`])
	})
	test(`happy: including optional options and missing optional positional args`, () => {
		const { suppliedOptions, positionalArgs } = testCli([`--foo=hello`, `--`])
		expect(suppliedOptions).toEqual({ foo: `hello` })
		expect(positionalArgs).toEqual([])
	})
	test(`happy: missing optional options and including optional positional args`, () => {
		const { suppliedOptions, positionalArgs } = testCli([`--`, `yo`])
		expect(suppliedOptions).toEqual({})
		expect(positionalArgs).toEqual([`yo`])
	})
})
