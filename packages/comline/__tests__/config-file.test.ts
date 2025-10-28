import * as fs from "node:fs"
import path from "node:path"

import { type } from "arktype"
import * as tmp from "tmp"
import { required } from "treetrunks"

import { cli, options } from "../src/cli"
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
			"": options(`blah`, type({ foo: `string` }), {
				foo: {
					description: `foo`,
					example: `--foo=hello`,
					flag: `f`,
					parse: parseStringOption,
					required: true,
				},
			}),
		},
	})
	test(`happy: export a schema`, () => {
		const { writeJsonSchema } = testCli([`--foo=hello`])
		writeJsonSchema(`${tempDir.name}`)
		const jsonSchemaContents = JSON.parse(
			fs.readFileSync(`${tempDir.name}/my-cli.main.schema.json`, `utf-8`),
		)
		const jsonSchemaFixtureLocation = path.join(
			import.meta.dirname,
			`fixtures/example-schema.json`,
		)
		const jsonSchemaFixtureContentsString = fs.readFileSync(
			jsonSchemaFixtureLocation,
			`utf-8`,
		)
		const jsonSchemaFixture = JSON.parse(jsonSchemaFixtureContentsString)
		expect(jsonSchemaContents).toEqual(jsonSchemaFixture)
	})
})
