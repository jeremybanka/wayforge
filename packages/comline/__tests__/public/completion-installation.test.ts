import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
import type * as FileSystem from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { installCompletion } from "../../src/completion-transport"
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
	`failed %s preserves the installed completion and removes staging files`,
	async (operation) => {
		const { file } = await injectInstallationFailure(directory, operation)
		await expect(installCompletion(`my-cli`, `carapace`)).rejects.toThrow()
		expect(readFileSync(file, `utf8`)).toBe(`previous completion\n`)
		expect(readdirSync(directory)).toEqual([`my-cli.yaml`])
	},
)

test.each(invalidDiscoveryCases)(
	`$target rejects discovery with $output without writing files`,
	async ({ target, output }) => {
		// Resolve any mistakenly accepted relative path into our disposable directory.
		const relative = path.relative(process.cwd(), path.join(directory, `new`))
		const stdout =
			output === `relative path`
				? target === `carapace`
					? `Specs are loaded from [${relative}].\n`
					: `\0completion-install\0ready\0${relative}\0${relative}\0`
				: `Welcome! Settings unavailable.\n`
		inspect.mockResolvedValue({ stdout, stderr: `` })
		await expect(installCompletion(`my-cli`, target)).rejects.toThrow()
		expect(readdirSync(directory)).toEqual([])
	},
)

test(`discovery ignores startup chatter and uses its framed absolute destination`, async () => {
	inspect.mockResolvedValue({
		stdout: `Welcome!\n\0completion-install\0ready\0${directory}\0${directory}\0`,
		stderr: ``,
	})
	const file = await installCompletion(`my-cli`, `bash`)
	expect(file).toBe(path.join(directory, `my-cli.bash`))

	expect(readdirSync(directory)).toEqual([`my-cli.bash`])
})
