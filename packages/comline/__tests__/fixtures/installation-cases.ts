import { writeFileSync } from "node:fs"
import type * as FileSystem from "node:fs/promises"
import { rename, writeFile } from "node:fs/promises"
import path from "node:path"

export async function injectInstallationFailure(
	directory: string,
	operation: `write` | `rename`,
) {
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
	return { file, failure }
}

export const invalidDiscoveryCases = [
	{
		target: `bash`,
		output: `missing marker`,
		message: `Check your shell startup configuration`,
	},
	{
		target: `carapace`,
		output: `malformed help`,
		message: `Could not discover Carapace's specs directory`,
	},
	{
		target: `bash`,
		output: `relative path`,
		message: `No writable bash completion directory`,
	},
	{
		target: `carapace`,
		output: `relative path`,
		message: `Could not discover Carapace's specs directory`,
	},
] as const
