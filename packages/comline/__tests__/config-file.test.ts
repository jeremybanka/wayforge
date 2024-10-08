import * as fs from "node:fs"

import * as tmp from "tmp"
import { required } from "treetrunks"
import { z } from "zod"

import { cli } from "../src/cli"
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
		routes: required({ $config: null }),
		routeOptions: {
			$config: {
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
		const { inputs } = testCli([`--`, `config.json`])
		expect(inputs.opts).toEqual({ foo: `hello` })
		expect(inputs.path).toEqual([`config.json`])
	})
	test(`error: missing required options in file`, () => {
		fs.writeFileSync(`${tempDir.name}/config.json`, `{}`)
		expect(() => testCli([`--`, `config.json`])).toThrow()
	})
	test(`happy: override options from file with cli options`, () => {
		fs.writeFileSync(`${tempDir.name}/config.json`, `{"foo":"hello"}`)
		const { inputs } = testCli([`--foo=goodbye`, `--`, `config.json`])
		expect(inputs.opts).toEqual({ foo: `goodbye` })
		expect(inputs.path).toEqual([`config.json`])
	})
})

describe(`creating a config schema`, () => {
	const testCli = cli({
		cliName: `my-cli`,
		routeOptions: {
			"": {
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
			},
		},
	})
	test(`happy: export a schema`, () => {
		const { writeJsonSchema } = testCli([`--foo=hello`])
		writeJsonSchema(`${tempDir.name}`)
		const jsonSchemaContents = JSON.parse(
			fs.readFileSync(`${tempDir.name}/my-cli.main.schema.json`, `utf-8`),
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
