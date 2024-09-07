import { z } from "zod"

import type { OptionsGroup } from "../src/cli"
import { cli } from "../src/cli"
import { parseStringOption } from "../src/option-parsers"
import { optional, required } from "../src/tree"

describe(`positional args from cli`, () => {
	const testCli = cli({
		cliName: `my-cli`,
		routes: required({
			hello: optional({
				world: null,
				$name: optional({ good: required({ morning: null }) }),
			}),
		}),
		routeOptions: {
			hello: null,
			"hello/world": null,
			"hello/$name": null,
			"hello/$name/good/morning": null,
		},
		options: {},
	})
	test(`happy: all positional args`, () => {
		const { inputs } = testCli([`--`, `hello`, `world`])
		expect(inputs.case).toEqual(`hello/world`)
		expect(inputs.path).toEqual([`hello`, `world`])
		expect(inputs.opts).toEqual({})
	})
	test(`happy: missing optional positional args`, () => {
		const { inputs } = testCli([`--`, `hello`])
		expect(inputs.case).toEqual(`hello`)
		expect(inputs.path).toEqual([`hello`])
		expect(inputs.opts).toEqual({})
	})
	test(`error: missing required positional args`, () => {
		expect(() => testCli([`--`])).toThrow()
	})
	test(`error: extra positional args`, () => {
		expect(() => testCli([`--`, `hello`, `world`, `extra`])).toThrow()
	})
	test(`happy: variable positional args`, () => {
		const { inputs } = testCli([`--`, `hello`, `jeff`, `good`, `morning`])
		expect(inputs.case).toEqual(`hello/$name/good/morning`)
		expect(inputs.path).toEqual([`hello`, `jeff`, `good`, `morning`])
		expect(inputs.opts).toEqual({})
	})
})

describe(`options and positional args from cli`, () => {
	const optionGroup = {
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
	} as OptionsGroup<{ foo?: string }>

	const testCli = cli({
		cliName: `my-cli`,
		routes: optional({ yo: null }),
		routeOptions: {
			"": optionGroup,
			yo: optionGroup,
		},
	})
	test(`happy: all options and positional args`, () => {
		const { inputs } = testCli([`--foo=hello`, `--`, `yo`])
		expect(inputs.case).toEqual(`yo`)
		expect(inputs.opts).toEqual({ foo: `hello` })
		expect(inputs.path).toEqual([`yo`])
	})
	test(`happy: including optional options and missing optional positional args`, () => {
		const { inputs } = testCli([`--foo=hello`, `--`])
		expect(inputs.case).toEqual(``)
		expect(inputs.opts).toEqual({ foo: `hello` })
		expect(inputs.path).toEqual([])
	})
	test(`happy: missing optional options and including optional positional args`, () => {
		const { inputs } = testCli([`--`, `yo`])
		expect(inputs.case).toEqual(`yo`)
		expect(inputs.opts).toEqual({})
		expect(inputs.path).toEqual([`yo`])
	})
})
