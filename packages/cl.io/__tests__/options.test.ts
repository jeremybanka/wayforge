import { z } from "zod"

import { cli } from "../src/cli"
import {
	parseBooleanArg,
	parseNumberArg,
	parseStringArg,
} from "../src/lib-public"

describe(`options from cli`, () => {
	const testCli = cli({
		positionalArgTree: [`optional`, {}],
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
				parse: parseStringArg,
				required: true,
			},
			bar: {
				description: `bar`,
				example: `--bar=1`,
				flag: `b`,
				parse: parseNumberArg,
				required: false,
			},
			baz: {
				description: `baz`,
				example: `--baz`,
				flag: `z`,
				parse: parseBooleanArg,
				required: false,
			},
		},
	})
	test(`happy: all options`, () => {
		const { config } = testCli([`--foo=hello`, `--bar=1`, `--baz`])
		expect(config).toEqual({
			foo: `hello`,
			bar: 1,
			baz: true,
		})
	})
	test(`happy: missing optional options`, () => {
		const { config } = testCli([`--foo=hello`, `-bb`])
		expect(config).toEqual({
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
		positionalArgTree: [`optional`, {}],
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
		const { config } = testCli([`--rules={"rule0": ["a", "b"]}`])
		expect(config).toEqual({
			rules: {
				rule0: [`a`, `b`],
			},
		})
	})
})
