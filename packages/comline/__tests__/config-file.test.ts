import * as fs from "node:fs"
import * as tmp from "tmp"
import { z } from "zod"

import { cli } from "../src/cli"
import { optional } from "../src/tree"
import { parseStringOption } from "../src/option-parsers"

let tempDir: tmp.DirResult

// eslint-disable-next-line @typescript-eslint/require-await
beforeEach(async () => {
	tempDir = tmp.dirSync({ unsafeCleanup: true })
})
afterEach(() => {
	tempDir.removeCallback()
})

describe(`options from file`, () => {
	const testCli = cli({
		cliName: `my-cli`,
		positionalArgTree: optional({ $config: null }),
		optionsSchema: z.object({ foo: z.string() }),
		options: {
			foo: {
				description: `foo`,
				example: `--foo=hello`,
				flag: `f`,
				parse: parseStringOption,
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
		const { suppliedOptions, positionalArgs } = testCli([`--`, `config.json`])
		expect(suppliedOptions).toEqual({ foo: `hello` })
		expect(positionalArgs).toEqual([`config.json`])
	})
	test(`error: missing required options in file`, () => {
		fs.writeFileSync(`${tempDir.name}/config.json`, `{}`)
		expect(() => testCli([`--`, `config.json`])).toThrow()
	})
	test(`happy: override options from file with cli options`, () => {
		fs.writeFileSync(`${tempDir.name}/config.json`, `{"foo":"hello"}`)
		const { suppliedOptions, positionalArgs } = testCli([
			`--foo=goodbye`,
			`--`,
			`config.json`,
		])
		expect(suppliedOptions).toEqual({ foo: `goodbye` })
		expect(positionalArgs).toEqual([`config.json`])
	})
})

describe(`creating a config schema`, () => {
	const testCli = cli({
		cliName: `my-cli`,
		optionsSchema: z.object({ foo: z.string() }),
		options: {
			foo: {
				description: `foo`,
				example: `--foo=hello`,
				flag: `f`,
				parse: parseStringOption,
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
		expect(jsonSchemaContents).toEqual({
			$schema: `http://json-schema.org/draft-07/schema#`,
			type: `object`,
			properties: {
				foo: {
					type: `string`,
				},
			},
			required: [`foo`],
			additionalProperties: false,
		})
	})
})
