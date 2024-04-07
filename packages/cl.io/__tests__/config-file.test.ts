import * as fs from "node:fs"
import * as tmp from "tmp"
import { z } from "zod"

import { cli } from "../src/cli"
import { OPTIONAL, parseStringArg } from "../src/lib-public"

let tempDir: tmp.DirResult

beforeEach(async () => {
	tempDir = tmp.dirSync({ unsafeCleanup: true })
})
afterEach(() => {
	tempDir.removeCallback()
})

describe(`options from file`, () => {
	const testCli = cli({
		positionalArgTree: [OPTIONAL, { $config: null }],
		optionsSchema: z.object({ foo: z.string() }),
		options: {
			foo: {
				description: `foo`,
				example: `--foo=hello`,
				flag: `f`,
				parse: parseStringArg,
				required: true,
			},
		},
		discoverConfigPath: (positionalArgs) => {
			if (positionalArgs[0]) {
				const configPath = positionalArgs[0]
				return `${tempDir.name}/${configPath}`
			}
		},
	})
	test(`happy: all options`, () => {
		fs.writeFileSync(`${tempDir.name}/config.json`, `{"foo":"hello"}`)
		const { config, positionalArgs } = testCli([`--`, `config.json`])
		expect(config).toEqual({ foo: `hello` })
		expect(positionalArgs).toEqual([`config.json`])
	})
	test(`error: missing required options in file`, () => {
		fs.writeFileSync(`${tempDir.name}/config.json`, `{}`)
		expect(() => testCli([`--`, `config.json`])).toThrow()
	})
	test(`happy: override options from file with cli options`, () => {
		fs.writeFileSync(`${tempDir.name}/config.json`, `{"foo":"hello"}`)
		const { config, positionalArgs } = testCli([
			`--foo=goodbye`,
			`--`,
			`config.json`,
		])
		expect(config).toEqual({ foo: `goodbye` })
		expect(positionalArgs).toEqual([`config.json`])
	})
})

describe(`creating a config schema`, () => {
	const testCli = cli({
		positionalArgTree: [OPTIONAL, {}],
		optionsSchema: z.object({ foo: z.string() }),
		options: {
			foo: {
				description: `foo`,
				example: `--foo=hello`,
				flag: `f`,
				parse: parseStringArg,
				required: true,
			},
		},
	})
	test(`happy: export a schema`, () => {
		const { writeJsonSchema } = testCli([`--foo=hello`])
		writeJsonSchema(`${tempDir.name}/schema.json`)
		const jsonSchemaContents = JSON.parse(
			fs.readFileSync(`${tempDir.name}/schema.json`, `utf-8`),
		)
		console.log({ jsonSchemaContents })
	})
})
