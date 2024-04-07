import * as tmp from "tmp"

import { cli } from "../src/cli"
import { z } from "zod"
import {
	OPTIONAL,
	parseBooleanArg,
	parseNumberArg,
	parseStringArg,
	REQUIRED,
} from "../src/lib-public"

let tempDir: tmp.DirResult

beforeEach(async () => {
	tempDir = tmp.dirSync({ unsafeCleanup: true })
})
afterEach(() => {
	tempDir.removeCallback()
})

describe(`named options`, () => {
	const myCli = cli({
		positionalArgTree: [`optional`, {}],
		optionsSchema: z.object({
			foo: z.string().optional(),
			bar: z.number().optional(),
			baz: z.boolean().optional(),
		}),
		options: {
			foo: {
				description: `foo`,
				example: `--foo=hello`,
				flag: `f`,
				parse: parseStringArg,
				required: false,
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
	it(`parses switches`, () => {
		const { config } = myCli([`--foo=hello`, `--bar=1`, `--baz`])
		expect(config).toEqual({
			foo: `hello`,
			bar: 1,
			baz: true,
		})
	})
	it(`parses flags`, () => {
		const { config } = myCli([`-f=hello`, `-bbb`, `-z`])
		expect(config).toEqual({
			foo: `hello`,
			bar: 3,
			baz: true,
		})
	})
})

describe(`positional arguments`, () => {
	const myCli = cli({
		positionalArgTree: [
			`required`,
			{
				hello: [
					`required`,
					{
						world: null,
					},
				],
			},
		],
		optionsSchema: z.object({}),
		options: {},
	})
	it(`parses positional arguments`, () => {
		const { positionalArgs, config } = myCli([`--`, `hello`, `world`])
		expect(positionalArgs).toEqual([`hello`, `world`])
		expect(config).toEqual({})
	})
})

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
	test(`happy: all options and positional args`, () => {})
	test(`happy: missing optional options and optional positional args`, () => {})
})

describe(`options from file`, () => {
	test(`happy: all options`, () => {})
	test(`error: missing required options in file`, () => {})
	test(`happy: discover file using positional args from cli`, () => {})
	test(`happy: override options from file with cli options`, () => {})
})
