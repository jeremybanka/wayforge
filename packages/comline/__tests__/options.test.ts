import { type } from "arktype"

import { cli } from "../src/cli"
import { parseNumberOption, parseStringOption } from "../src/option-parsers"

describe(`options from cli`, () => {
	const testCli = cli({
		cliName: `my-cli`,
		routeOptions: {
			"": {
				description: `description`,
				optionsSchema: type({ foo: `string`, bar: `number` }),
				options: {
					foo: {
						description: `foo`,
						example: `--foo=hello`,
						flag: `f`,
						parse: parseStringOption,
						required: true,
					},
					bar: {
						description: `bar`,
						example: `--bar=1`,
						flag: `b`,
						parse: parseNumberOption,
						required: false,
					},
				},
			},
		},
	})
	test(`happy: all options`, () => {
		const { inputs } = testCli([`--foo=hello`, `--bar=1`, `--baz`])
		expect(inputs.opts).toEqual({
			foo: `hello`,
			bar: 1,
		})
	})
	test(`happy: missing optional options`, () => {
		const { inputs } = testCli([`--foo=hello`, `-bb`, `--help`])
		expect(inputs.opts).toEqual({
			foo: `hello`,
			bar: 2,
		})
	})
	test(`error: missing required options`, () => {
		expect(() => testCli([`--bar=1`])).toThrow()
	})
	test(`error: wrong types`, () => {
		expect(() => testCli([`--foo=hello`, `--bar=hello`])).toThrow()
	})
})

describe(`complex options`, () => {
	const testCli = cli({
		cliName: `my-cli`,
		routeOptions: {
			"": {
				optionsSchema: type({
					rules: {
						rule0: [`string`, `string`],
					},
				}),
				options: {
					rules: {
						description: `rules`,
						example: `--rules='{"rule0": ["a", "b"]}'`,
						flag: `r`,
						parse: JSON.parse,
						required: true,
					},
				},
			},
		},
	})
	test(`happy: all options`, () => {
		const { inputs } = testCli([`--rules={"rule0": ["a", "b"]}`])
		expect(inputs.opts).toEqual({
			rules: {
				rule0: [`a`, `b`],
			},
		})
	})
})
