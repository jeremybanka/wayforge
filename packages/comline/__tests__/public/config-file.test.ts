import * as fs from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { type } from "arktype"
import { optional, required } from "treetrunks"
import { expectTypeOf, vi } from "vitest"
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
	test.each([`ts`, `mts`, `js`, `mjs`, `cts`, `cjs`])(
		`loads computed options from a .%s module without changing cached exports`,
		(extension) => {
			const commonjs = extension === `cts` || extension === `cjs`
			const typescript = [`ts`, `mts`, `cts`].includes(extension)
			fs.writeFileSync(`${tempDir}/package.json`, `{"type":"module"}`)
			fs.writeFileSync(
				`${tempDir}/helper.ts`,
				`export function greet(name: string): string { return "hello " + name }`,
			)
			fs.writeFileSync(
				`${tempDir}/config.${extension}`,
				[
					commonjs
						? `const { greet } = require("./helper.ts")`
						: `import { greet } from "./helper.ts"`,
					`const config${typescript ? `: { foo: string }` : ``} = Object.freeze({ foo: greet("world") })`,
					commonjs ? `module.exports = config` : `export default config`,
				].join(`\n`),
			)
			const configPath = `config.${extension}`
			expect(testCli(argv(`--`, configPath)).inputs.opts).toEqual({
				foo: `hello world`,
			})
			expect(
				testCli(argv(`--foo=override`, `--`, configPath)).inputs.opts,
			).toEqual({ foo: `override` })
			expect(testCli(argv(`--`, configPath)).inputs.opts).toEqual({
				foo: `hello world`,
			})
		},
	)
	test.each([
		`export default { foo: 42 }`,
		`export default {}`,
		`export const foo = "hello"`,
		`export default () => ({ foo: "hello" })`,
		`export default Promise.resolve({ foo: "hello" })`,
		`await Promise.resolve(); export default { foo: "hello" }`,
		`throw new Error("config failed")`,
		`import "./missing.ts"; export default { foo: "hello" }`,
		`export default {`,
	])(`rejects invalid or unloadable module configs: %s`, (source) => {
		fs.writeFileSync(`${tempDir}/config.mts`, source)
		expect(() => testCli(argv(`--`, `config.mts`))).toThrow()
	})
	test.each([`json`, `ts`])(`ignores missing .%s configs`, (extension) => {
		expect(
			testCli(argv(`--foo=cli`, `--`, `missing.${extension}`)).inputs.opts,
		).toEqual({ foo: `cli` })
	})
	test(`resolves relative config paths against the working directory`, () => {
		fs.writeFileSync(
			`${tempDir}/relative.mts`,
			`export default { foo: "relative" }`,
		)
		const parse = cli({
			...testCli.definition,
			discoverConfigPath: () =>
				path.relative(process.cwd(), `${tempDir}/relative.mts`),
		})
		expect(parse(argv(`config`)).inputs.opts).toEqual({ foo: `relative` })
	})
})

test.each([undefined, () => undefined])(
	`does not discover configs when discovery is omitted or returns undefined: %s`,
	(discoverConfigPath) => {
		fs.writeFileSync(`${tempDir}/my-cli.config.json`, `invalid json`)
		fs.writeFileSync(
			`${tempDir}/my-cli.config.ts`,
			`throw new Error("must not execute")`,
		)
		const cwd = vi.spyOn(process, `cwd`).mockReturnValue(tempDir)
		try {
			const parse = cli({
				cliName: `my-cli`,
				routeOptions: { "": null },
				...(discoverConfigPath ? { discoverConfigPath } : {}),
			})
			expect(parse(argv()).inputs.opts).toEqual({})
		} finally {
			cwd.mockRestore()
		}
	},
)

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
