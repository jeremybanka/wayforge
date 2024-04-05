import * as tmp from "tmp"

import { cli } from "../src/cli"
import { z } from "zod"
import { parseNumberArg } from "../src/lib-public"

let tempDir: tmp.DirResult

beforeEach(async () => {
	tempDir = tmp.dirSync({ unsafeCleanup: true })
})
afterEach(() => {
	tempDir.removeCallback()
})

describe(`no config`, () => {
	const myCli = cli({
		argSchema: z.object({
			foo: z.string(),
			bar: z.number(),
		}),
		arguments: {
			foo: {
				description: `foo`,
				example: `--foo=hello`,
				flag: `-f`,
				parse: (arg) => arg,
				required: true,
			},
			bar: {
				description: `bar`,
				example: `--bar=1`,
				flag: `-b`,
				parse: parseNumberArg,
				required: true,
			},
		},
	})
    it(`parses`, () => {
		const { arguments } = myCli([`--foo=hello`, `--bar=1`])
		expect(arguments).toEqual({
			foo: `hello`,
			bar: 1,
		})
	})
})
