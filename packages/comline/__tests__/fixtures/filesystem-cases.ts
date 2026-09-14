import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { z } from "zod"

import { options } from "../../src/cli"
import type { CompletionHints } from "../../src/completion"

export function definition(completion: CompletionHints) {
	return {
		cliName: `my-cli`,
		routeOptions: {
			"": options(``, z.object({ input: z.string().optional() }), {
				input: { description: ``, example: ``, required: false, completion },
			}),
		},
	}
}

export function createFilesystemDirectory(): string {
	const directory = mkdtempSync(path.join(tmpdir(), `comline-filesystem-`))
	writeFileSync(path.join(directory, `file.txt`), ``)
	writeFileSync(path.join(directory, `.hidden`), ``)
	mkdirSync(path.join(directory, `folder`))
	symlinkSync(`file.txt`, path.join(directory, `linked-file`))
	symlinkSync(`folder`, path.join(directory, `linked-folder`))
	symlinkSync(`missing`, path.join(directory, `broken`))
	return directory
}
