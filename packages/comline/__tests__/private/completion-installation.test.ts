import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import type * as FileSystem from "node:fs/promises"
import { rename, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import {
	completionScript,
	installCompletion,
} from "../../src/completion-transport"
import {
	injectInstallationFailure,
	invalidDiscoveryCases,
} from "../fixtures/installation-cases"

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
	`failed %s propagates the original filesystem error object`,
	async (operation) => {
		const { failure } = await injectInstallationFailure(directory, operation)
		await expect(installCompletion(`my-cli`, `carapace`)).rejects.toBe(failure)
	},
)

test.each(invalidDiscoveryCases)(
	`$target uses discovery error wording and skips filesystem calls for $output`,
	async ({ target, output, message }) => {
		// Resolve any mistakenly accepted relative path into our disposable directory.
		const relative = path.relative(process.cwd(), path.join(directory, `new`))
		const stdout =
			output === `relative path`
				? target === `carapace`
					? `Specs are loaded from [${relative}].\n`
					: `\0completion-install\0ready\0${relative}\0${relative}\0`
				: `Welcome! Settings unavailable.\n`
		inspect.mockResolvedValue({ stdout, stderr: `` })
		await expect(installCompletion(`my-cli`, target)).rejects.toThrow(message)

		expect(writeFile).not.toHaveBeenCalled()
		expect(rename).not.toHaveBeenCalled()
	},
)

test(`framed Bash discovery writes the generator bytes unchanged`, async () => {
	inspect.mockResolvedValue({
		stdout: `Welcome!\n\0completion-install\0ready\0${directory}\0${directory}\0`,
		stderr: ``,
	})
	const file = await installCompletion(`my-cli`, `bash`)

	expect(readFileSync(file, `utf8`)).toBe(completionScript(`my-cli`, `bash`))
})
