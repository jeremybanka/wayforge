import { z } from "zod"

import { cli } from "../src/cli"
import {
	parseBooleanOption,
	parseNumberOption,
	parseStringOption,
} from "../src/option-parsers"

describe(`options from cli`, () => {
	const testCli = cli({
		cliName: `my-cli`,
		optionsSchema: z.object({
			foo: z.string(),
			bar: z.number().optional(),
			baz: z.boolean().optional(),
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
			baz: {
				description: `baz`,
				example: `--baz`,
				flag: `z`,
				parse: parseBooleanOption,
				required: false,
			},
		},
	})
	test(`happy: all options`, () => {
		const { suppliedOptions } = testCli([`--foo=hello`, `--bar=1`, `--baz`])
		expect(suppliedOptions).toEqual({
			foo: `hello`,
			bar: 1,
			baz: true,
		})
	})
	test(`happy: missing optional options`, () => {
		const { suppliedOptions } = testCli([`--foo=hello`, `-bb`])
		expect(suppliedOptions).toEqual({
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
	})
	test(`happy: all options`, () => {
		const { suppliedOptions } = testCli([`--rules={"rule0": ["a", "b"]}`])
		expect(suppliedOptions).toEqual({
			rules: {
				rule0: [`a`, `b`],
			},
		})
	})
})
