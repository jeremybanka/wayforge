import * as fs from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { type } from "arktype"
import z from "zod"

import { cli, options } from "../../src/cli"
import { parseStringOption } from "../../src/option-parsers"
import { argv } from "../fixtures/argv"

let tempDir: string

// oxlint-disable-next-line typescript/require-await
beforeEach(async () => {
	tempDir = fs.mkdtempSync(path.join(tmpdir(), `comline-`))
})
afterEach(() => {
	fs.rmSync(tempDir, { recursive: true, force: true })
})

describe(`creating a config schema`, () => {
	const optionConfigs = {
		foo: {
			description: `foo`,
			example: `--foo=hello`,
			flag: `f` as const,
			parse: parseStringOption,
			required: true,
		},
	}
	const arktypeTestCli = cli({
		cliName: `my-cli`,
		routeOptions: {
			"": options(`blah`, type({ foo: `string` }), optionConfigs),
		},
	})
	const zodTestCli = cli({
		cliName: `my-cli`,
		routeOptions: {
			"": options(`blah`, z.object({ foo: z.string() }), optionConfigs),
		},
	})
	function expectWritesExampleSchema(testCli: ReturnType<typeof cli>): void {
		const { writeJsonSchema } = testCli(argv(`--foo=hello`))
		writeJsonSchema(`${tempDir}`)
		const jsonSchemaContents = JSON.parse(
			fs.readFileSync(`${tempDir}/my-cli.main.schema.json`, `utf-8`),
		)
		const jsonSchemaFixtureLocation = path.join(
			import.meta.dirname,
			`../fixtures/example-schema.json`,
		)
		const jsonSchemaFixtureContentsString = fs.readFileSync(
			jsonSchemaFixtureLocation,
			`utf-8`,
		)
		const jsonSchemaFixture = JSON.parse(jsonSchemaFixtureContentsString)
		expect(jsonSchemaContents).toEqual(jsonSchemaFixture)
	}
	test(`happy: export an arktype schema`, () => {
		expectWritesExampleSchema(arktypeTestCli)
	})
	test(`happy: export a zod schema`, () => {
		expectWritesExampleSchema(zodTestCli)
	})
})
