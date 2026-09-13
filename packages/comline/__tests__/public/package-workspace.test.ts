import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { packComline } from "../fixtures/comline-workspace"

test(`the package contains its declared entries and resolves workspace dependencies`, () => {
	const directory = mkdtempSync(
		path.join(tmpdir(), `comline-package-isolation-`),
	)
	try {
		const source = path.join(import.meta.dirname, `../..`)
		const archive = packComline(
			source,
			path.join(directory, `consumer`),
			(args, cwd) => {
				execFileSync(`pnpm`, args, { cwd, stdio: `pipe`, timeout: 60_000 })
			},
		)

		const packed = JSON.parse(
			execFileSync(`tar`, [`-xOf`, archive, `package/package.json`], {
				encoding: `utf8`,
			}),
		)
		const sibling = JSON.parse(
			readFileSync(path.join(source, `../treetrunks/package.json`), `utf8`),
		)

		expect(packed.dependencies.treetrunks).toBe(sibling.version)
		const entries = execFileSync(`tar`, [`-tf`, archive], {
			encoding: `utf8`,
		}).split(`\n`)
		expect(entries).toContain(`package/${packed.main}`)
		expect(entries).toContain(`package/${packed.types}`)
	} finally {
		rmSync(directory, { recursive: true, force: true })
	}
}, 60_000)
