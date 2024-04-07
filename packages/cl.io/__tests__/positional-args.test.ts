import { z } from "zod"

import { cli } from "../src/cli"
import { OPTIONAL, parseStringArg, REQUIRED } from "../src/lib-public"

describe(`positional args from cli`, () => {
	const testCli = cli({
		positionalArgTree: [
			REQUIRED,
			{
				hello: [
					OPTIONAL,
					{
						world: null,
						$name: [OPTIONAL, { good: [REQUIRED, { morning: null }] }],
					},
				],
			},
		],
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
		positionalArgTree: [OPTIONAL, { yo: null }],
		optionsSchema: z.object({ foo: z.string().optional() }),
		options: {
			foo: {
				description: `foo`,
				example: `--foo=hello`,
				flag: `f`,
				parse: parseStringArg,
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
