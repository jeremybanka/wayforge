import {
	mkdirSync,
	mkdtempSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs"
import type * as FileSystem from "node:fs/promises"
import { readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { z } from "zod"

import { options } from "../src/cli"
import type { CompletionHints } from "../src/completion"
import { completionResponse } from "../src/completion-transport"
import { argv } from "./fixtures/argv"

vi.mock(`node:fs/promises`, async (importOriginal) => {
	const actual = await importOriginal<typeof FileSystem>()
	return { ...actual, readdir: vi.fn(actual.readdir) }
})

function definition(completion: CompletionHints) {
	return {
		cliName: `my-cli`,
		routeOptions: {
			"": options(``, z.object({ input: z.string().optional() }), {
				input: { description: ``, example: ``, required: false, completion },
			}),
		},
	}
}

let directory: string
beforeEach(() => {
	directory = mkdtempSync(path.join(tmpdir(), `comline-filesystem-`))
	writeFileSync(path.join(directory, `file.txt`), ``)
	writeFileSync(path.join(directory, `.hidden`), ``)
	mkdirSync(path.join(directory, `folder`))
	symlinkSync(`file.txt`, path.join(directory, `linked-file`))
	symlinkSync(`folder`, path.join(directory, `linked-folder`))
	symlinkSync(`missing`, path.join(directory, `broken`))
})
afterEach(() => {
	vi.resetAllMocks()
	rmSync(directory, { recursive: true, force: true })
})

test.each([
	{
		fileSystem: `files`,
		names: [`file.txt`, `folder/`, `linked-file`, `linked-folder/`],
	},
	{ fileSystem: `directories`, names: [`folder/`, `linked-folder/`] },
] as const)(
	`$fileSystem follows valid symlinks and omits broken links`,
	async ({ fileSystem, names }) => {
		const response = await completionResponse(
			definition({ fileSystem }),
			argv(`_carapace`, `export`, ``, `--input`, `${directory}/`),
		)
		const result = JSON.parse(response!)
		expect(result.values).toHaveLength(names.length)
		expect(result).toEqual({
			nospace: `*`,
			messages: [],
			values: expect.arrayContaining(
				names.map((name) => ({
					value: `${directory}/${name}`,
					display: `${directory}/${name}`,
					description: ``,
				})),
			),
		})
	},
)

test.each([
	{ prefix: `.`, name: `.hidden` },
	{ prefix: `fi`, name: `file.txt` },
])(
	`filesystem prefix $prefix selects matching entries with file spacing`,
	async ({ prefix, name }) => {
		const response = await completionResponse(
			definition({ fileSystem: `files` }),
			argv(`_carapace`, `export`, ``, `--input`, `${directory}/${prefix}`),
		)
		expect(JSON.parse(response!)).toEqual({
			nospace: ``,
			messages: [],
			values: [
				{
					value: `${directory}/${name}`,
					display: `${directory}/${name}`,
					description: ``,
				},
			],
		})
	},
)

test.each([`missing`, `unreadable`] as const)(
	`a %s directory produces an empty response`,
	async (kind) => {
		// Inject EACCES so this guarantee also runs under privileged CI users.
		if (kind === `unreadable`)
			vi.mocked(readdir).mockRejectedValueOnce(
				Object.assign(new Error(`Permission denied`), { code: `EACCES` }),
			)
		const prefix = kind === `missing` ? `${directory}/missing/` : `${directory}/`
		const response = await completionResponse(
			definition({ fileSystem: `files` }),
			argv(`_carapace`, `export`, ``, `--input`, prefix),
		)
		expect(JSON.parse(response!)).toEqual({
			nospace: ``,
			messages: [],
			values: [],
		})
	},
)
