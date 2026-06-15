import { type } from "arktype"
import z from "zod"

import { cli, options } from "../src/cli"
import { parseNumberOption, parseStringOption } from "../src/option-parsers"

describe(`options from cli`, () => {
	const testCli = cli({
		cliName: `my-cli`,
		routeOptions: {
			"": options(
				`description`,
				z.object({ foo: z.string(), bar: z.number().optional() }),
				{
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
			),
		},
	})
	test(`happy: all options`, () => {
		const { inputs } = testCli([`--foo=hello`, `--bar=1`, `--baz`])
		expect(inputs.opts).toEqual({
			foo: `hello`,
			bar: 1,
		})
	})
	test(`happy: all options without equals signs`, () => {
		const { inputs } = testCli([`--foo`, `hello`, `--bar`, `1`])
		expect(inputs.opts).toEqual({
			foo: `hello`,
			bar: 1,
		})
	})
	test(`happy: repeated options with mixed value separators`, () => {
		const { inputs } = testCli([`--foo`, `one`, `--foo=two`])
		expect(inputs.opts).toEqual({
			foo: `one,two`,
		})
	})
	test(`happy: flags with values without equals signs`, () => {
		const { inputs } = testCli([`-f`, `hello`, `-b`, `1`])
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
	test(`happy: bare options remain bare before other options`, () => {
		const { inputs } = testCli([`--foo`, `--bar`, `1`])
		expect(inputs.opts).toEqual({
			foo: ``,
			bar: 1,
		})
	})
	test(`error: missing required options`, () => {
		expect(() => testCli([`--bar=1`])).toThrow()
	})
	test(`error: wrong types`, () => {
		expect(() => testCli([`--foo=hello`, `--bar=hello`])).toThrow()
	})
	test(`error: switch names must match exactly`, () => {
		expect(() => testCli([`--foobar=hello`])).toThrow()
	})
})

describe(`complex options`, () => {
	const testCli = cli({
		cliName: `my-cli`,
		routeOptions: {
			"": options(`example`, type({ rules: { rule0: [`string`, `string`] } }), {
				rules: {
					description: `rules`,
					example: `--rules='{"rule0": ["a", "b"]}'`,
					flag: `r`,
					parse: JSON.parse,
					required: true,
				},
			}),
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
	test(`happy: all options without equals signs`, () => {
		const { inputs } = testCli([`--rules`, `{"rule0": ["a", "b"]}`])
		expect(inputs.opts).toEqual({
			rules: {
				rule0: [`a`, `b`],
			},
		})
	})
})
