import {
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs"
import type * as FileSystem from "node:fs/promises"
import { rename, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { installCompletion } from "../src/completion-transport"

const inspect = vi.hoisted(() => vi.fn())

// Control discovery output at the subprocess boundary; installation still uses
// the real filesystem and the public API, without requiring shell startup.
vi.mock(`node:child_process`, async () => {
	const { promisify } = await import(`node:util`)
	return { execFile: Object.assign(vi.fn(), { [promisify.custom]: inspect }) }
})
vi.mock(`node:fs/promises`, async (importOriginal) => {
	const actual = await importOriginal<typeof FileSystem>()
	return {
		...actual,
		writeFile: vi.fn(actual.writeFile),
		rename: vi.fn(actual.rename),
	}
})

let directory: string
beforeEach(() => {
	directory = mkdtempSync(path.join(tmpdir(), `comline-installation-`))
	inspect.mockResolvedValue({
		stdout: `Specs are loaded from [${directory}].\n`,
		stderr: ``,
	})
})
afterEach(() => {
	vi.resetAllMocks()
	rmSync(directory, { recursive: true, force: true })
})

test.each([`write`, `rename`] as const)(
	`failed %s preserves the installed completion and removes staging files`,
	async (operation) => {
		const file = path.join(directory, `my-cli.yaml`)
		writeFileSync(file, `previous completion\n`)
		const failure = new Error(`injected ${operation} failure`)
		if (operation === `write`) {
			const actual = await vi.importActual<typeof FileSystem>(`node:fs/promises`)
			vi.mocked(writeFile).mockImplementationOnce(async (staged) => {
				// A failed write may already have left partial output on disk.
				await actual.writeFile(staged, `partial completion`)
				throw failure
			})
		} else {
			vi.mocked(rename).mockRejectedValueOnce(failure)
		}
		await expect(installCompletion(`my-cli`, `carapace`)).rejects.toBe(failure)
		expect(readFileSync(file, `utf8`)).toBe(`previous completion\n`)
		expect(readdirSync(directory)).toEqual([`my-cli.yaml`])
	},
)
