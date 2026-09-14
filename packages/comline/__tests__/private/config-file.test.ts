import * as fs from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

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

describe(`creating a config schema`, () => {
	test.each(configSchemas)(
		`matches the example schema exactly for $name`,
		({ schema }) => {
			const testCli = createConfigSchemaCli(schema)
			const jsonSchemaContents = writeExampleSchema(testCli, tempDir)
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
		},
	)
})
