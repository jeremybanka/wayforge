import { rmSync } from "node:fs"
import type * as FileSystem from "node:fs/promises"
import { readdir } from "node:fs/promises"

import { completionResponse } from "../../src/completion-transport"
import { argv } from "../fixtures/argv"
import {
	createFilesystemDirectory,
	definition,
} from "../fixtures/filesystem-cases"

vi.mock(`node:fs/promises`, async (importOriginal) => {
	const actual = await importOriginal<typeof FileSystem>()
	return { ...actual, readdir: vi.fn(actual.readdir) }
})

let directory: string
beforeEach(() => {
	directory = createFilesystemDirectory()
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
	`$fileSystem uses exact Carapace response and entry fields for symlinks`,
	async ({ fileSystem, names }) => {
		const response = await completionResponse(
			definition({ fileSystem }),
			argv(`_carapace`, `export`, ``, `--input`, `${directory}/`),
		)
		const result = JSON.parse(response!)

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
	`filesystem prefix $prefix uses the exact Carapace response shape`,
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
	`a %s directory uses the exact empty Carapace response shape`,
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

test(`Carapace uses exact records for mixed inline provider and filesystem candidates`, async () => {
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
