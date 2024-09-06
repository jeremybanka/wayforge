import { z } from "zod"

import { cli } from "../src/cli"
import { parseNumberOption, parseStringOption } from "../src/option-parsers"

describe(`options from cli`, () => {
	const testCli = cli({
		cliName: `my-cli`,
		routeOptions: {
			"": {
				optionsSchema: z.object({
					foo: z.string(),
					bar: z.number().optional(),
				}),
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
		const { inputs } = testCli([`--foo=hello`, `-bb`])
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
				optionsSchema: z.object({
					rules: z.object({
						rule0: z.tuple([z.string(), z.string()]),
					}),
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
