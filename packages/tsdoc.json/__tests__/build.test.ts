import path from "node:path"
import url from "node:url"

import { compileDocs } from "../src"

const FILEPATH = url.fileURLToPath(import.meta.url)
const DIRNAME = path.dirname(FILEPATH)

beforeEach(async () => {})
afterEach(() => {})

describe(`tsdoc.json`, () => {
	it(`builds docs for atom.io`, () => {
		const entrypoint = path.join(DIRNAME, `fixtures`, `src`, `index.ts`)
		const tsconfigPath = path.join(DIRNAME, `..`, `tsconfig.json`)
		const doc = compileDocs({ entrypoint, tsconfigPath })
	})
})
