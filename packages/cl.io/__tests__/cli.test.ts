import * as tmp from "tmp"

import { cli } from "../src/cli"
import { z } from "zod"
import {
	parseBooleanArg,
	parseNumberArg,
	parseStringArg,
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
		optionsSchema: z.object({}),
		options: {},
	})
	it(`parses positional arguments`, () => {
		const { positionalArgs, config } = myCli([`--`, `hello`, `world`])
		expect(config).toEqual([`hello`, `world`])
	})
})
