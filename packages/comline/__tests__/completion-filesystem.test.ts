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

test.each([`__complete`, `_comline`] as const)(
	`%s combines provider and filesystem values without shell fallback`,
	async (command) => {
		const response = await completionResponse(
			definition({
				fileSystem: `files`,
				provide: () => [
					{ value: `${directory}/future`, description: `Remote file` },
				],
			}),
			argv(
				command,
				...(command === `_comline` ? [`complete`] : []),
				`--input=${directory}/f`,
			),
		)
		const lines = response!.trimEnd().split(`\n`)
		if (command === `_comline`) expect(lines.shift()).toBe(`prefix:--input=`)
		// NoFileCompletion prevents a second shell filesystem pass; NoSpace keeps
		// the directory candidate open for further completion. Cobra owns its prefix.
		expect(lines.pop()).toBe(`:6`)
		expect(lines.sort()).toEqual([
			`${directory}/file.txt`,
			`${directory}/folder/`,
			`${directory}/future\tRemote file`,
		])
	},
)

test(`Carapace preserves inline replacement boundaries for mixed candidates`, async () => {
	const response = await completionResponse(
		definition({
			fileSystem: `files`,
			provide: () => [
				{ value: `${directory}/future`, description: `Remote file` },
			],
		}),
		argv(`_carapace`, `export`, ``, `--input=${directory}/f`),
	)
	const result = JSON.parse(response!)
	expect(result.values).toHaveLength(3)
	expect(result).toEqual({
		nospace: `*`,
		messages: [],
		values: expect.arrayContaining([
			{
				value: `--input=${directory}/future`,
				display: `${directory}/future`,
				description: `Remote file`,
			},
			{
				value: `--input=${directory}/file.txt`,
				display: `${directory}/file.txt`,
				description: ``,
			},
			{
				value: `--input=${directory}/folder/`,
				display: `${directory}/folder/`,
				description: ``,
			},
		]),
	})
})

test(`filesystem read failures preserve provider candidates and their spacing`, async () => {
	const response = await completionResponse(
		definition({
			fileSystem: `files`,
			provide: () => [`${directory}/missing/remote`],
		}),
		argv(`__complete`, `--input`, `${directory}/missing/`),
	)
	expect(response).toBe(`${directory}/missing/remote\n:4\n`)
})
