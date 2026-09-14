import * as fs from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { type } from "arktype"
import { optional, required } from "treetrunks"
import { expectTypeOf } from "vitest"
import z from "zod"

import { cli, options } from "../../src/cli"
import { parseStringOption } from "../../src/option-parsers"
import { argv } from "../fixtures/argv"
import {
	configSchemas,
	createConfigSchemaCli,
	writeExampleSchema,
} from "../fixtures/schema-cases"

let tempDir: string

beforeEach(() => {
	tempDir = fs.mkdtempSync(path.join(tmpdir(), `comline-`))
})
afterEach(() => {
	fs.rmSync(tempDir, { recursive: true, force: true })
})

describe(`options from file`, () => {
	const testCli = cli({
		cliName: `my-cli`,
		routes: required({ $config: null }),
		routeOptions: {
			$config: options(`blah`, type({ foo: `string` }), {
				foo: {
					description: `foo`,
					example: `--foo=hello`,
					flag: `f`,
					parse: parseStringOption,
					required: true,
				},
			}),
		},
		discoverConfigPath: (positionalArgs) => {
			expectTypeOf(positionalArgs).toEqualTypeOf<[string & {}]>()
			if (positionalArgs[0]) {
				const configPath = positionalArgs[0]
				return `${tempDir}/${configPath}`
			}
		},
	})
	test(`happy: all options`, () => {
		fs.writeFileSync(`${tempDir}/config.json`, `{"foo":"hello"}`)
		const { inputs } = testCli(argv(`--`, `config.json`))
		expectTypeOf(inputs.opts).toEqualTypeOf<{ foo: string }>()
		expectTypeOf(inputs.path).toEqualTypeOf<[string & {}]>()
		expect(inputs.opts).toEqual({ foo: `hello` })
		expect(inputs.path).toEqual([`config.json`])
	})
	test(`error: missing required options in file`, () => {
		fs.writeFileSync(`${tempDir}/config.json`, `{}`)
		expect(() => testCli(argv(`--`, `config.json`))).toThrow()
	})
	test(`happy: override options from file with cli options`, () => {
		fs.writeFileSync(`${tempDir}/config.json`, `{"foo":"hello"}`)
		const { inputs } = testCli(argv(`--foo=goodbye`, `--`, `config.json`))
		expect(inputs.opts).toEqual({ foo: `goodbye` })
		expect(inputs.path).toEqual([`config.json`])
	})
})

test(`config discovery infers nested literal, variable, and optional routes`, () => {
	const testCli = cli({
		cliName: `nested-config`,
		routes: required({
			serve: optional({ $config: null }),
			build: required({ production: null }),
		}),
		routeOptions: {
			serve: null,
			"serve/$config": null,
			"build/production": null,
		},
		discoverConfigPath(positionalArgs) {
			expectTypeOf(positionalArgs).toEqualTypeOf<
				[`serve`] | [`serve`, string & {}] | [`build`, `production`]
			>()
			if (positionalArgs[0] === `build`) {
				expectTypeOf(positionalArgs[1]).toEqualTypeOf<`production`>()
			}
			return undefined
		},
	})
	expect(testCli(argv(`serve`)).inputs.path).toEqual([`serve`])
	expect(testCli(argv(`serve`, `config.json`)).inputs.path).toEqual([
		`serve`,
		`config.json`,
	])
	expect(testCli(argv(`build`, `production`)).inputs.path).toEqual([
		`build`,
		`production`,
	])
})

describe(`creating a config schema`, () => {
	test.each(configSchemas)(`exports a usable $name schema`, ({ schema }) => {
		const testCli = createConfigSchemaCli(schema)
		const jsonSchemaContents = writeExampleSchema(testCli, tempDir)
		const validator = z.fromJSONSchema(jsonSchemaContents)
		expect(validator.safeParse({ foo: `hello` }).success).toBe(true)
		expect(validator.safeParse({ foo: `` }).success).toBe(true)
		expect(validator.safeParse({}).success).toBe(false)
		expect(validator.safeParse({ foo: 42 }).success).toBe(false)
		expect(validator.safeParse({ foo: `hello`, extra: true }).success).toBe(
			false,
		)
	})
})
