import path from "node:path"
import url from "node:url"

import { compileDocs } from "../src"

const FILEPATH = url.fileURLToPath(import.meta.url)
const DIRNAME = path.dirname(FILEPATH)

beforeEach(async () => {})
afterEach(() => {})

describe(`tsdoc.json`, () => {
	it.skip(`builds a doc for a regular function`, async () => {
		const entrypoint = path.join(
			DIRNAME,
			`fixtures`,
			`src`,
			`function-declaration.ts`,
		)
		const tsconfigPath = path.join(DIRNAME, `..`, `tsconfig.json`)
		const doc = compileDocs({ entrypoint, tsconfigPath })
		await Bun.write(
			path.join(DIRNAME, `fixtures`, `src`, `function-declaration.json`),
			JSON.stringify(doc, null, `\t`),
		)
	})
	it(`builds a doc for a class`, async () => {
		const entrypoint = path.join(
			DIRNAME,
			`fixtures`,
			`src`,
			`class-declaration.ts`,
		)
		const tsconfigPath = path.join(DIRNAME, `..`, `tsconfig.json`)
		const doc = compileDocs({ entrypoint, tsconfigPath })
		await Bun.write(
			path.join(DIRNAME, `fixtures`, `src`, `class-declaration.json`),
			JSON.stringify(doc, null, `\t`),
		)
	})
})
