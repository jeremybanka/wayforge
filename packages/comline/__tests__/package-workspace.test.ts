import { execFileSync } from "node:child_process"
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { copyPackageWorkspace, packComline } from "./fixtures/package-workspace"

test(`building the packed consumer leaves an existing workspace build untouched`, () => {
	const directory = mkdtempSync(
		path.join(tmpdir(), `comline-package-isolation-`),
	)
	try {
		// A disposable source workspace makes the regression deterministic: the old
		// in-place clean build always deletes this live consumer's marker and entry.
		const source = copyPackageWorkspace(
			path.join(import.meta.dirname, `..`),
			path.join(directory, `source`),
		)
		const dist = path.join(source, `dist`)
		mkdirSync(dist)
		writeFileSync(path.join(dist, `live-consumer`), `keep this build`)
		writeFileSync(path.join(dist, `cli.js`), `export const live = true\n`)
		const archive = packComline(
			source,
			path.join(directory, `consumer`),
			(args, cwd) => {
				execFileSync(`pnpm`, args, { cwd, stdio: `pipe`, timeout: 60_000 })
			},
		)
		expect(readFileSync(path.join(dist, `live-consumer`), `utf8`)).toBe(
			`keep this build`,
		)
		expect(readFileSync(path.join(dist, `cli.js`), `utf8`)).toBe(
			`export const live = true\n`,
		)
		const packed = JSON.parse(
			execFileSync(`tar`, [`-xOf`, archive, `package/package.json`], {
				encoding: `utf8`,
			}),
		)
		const original = JSON.parse(
			readFileSync(path.join(source, `package.json`), `utf8`),
		)
		const sibling = JSON.parse(
			readFileSync(path.join(source, `../treetrunks/package.json`), `utf8`),
		)
		expect(packed.main).toBe(original.main)
		expect(packed.types).toBe(original.types)
		expect(packed.dependencies.treetrunks).toBe(sibling.version)
		const entries = execFileSync(`tar`, [`-tf`, archive], {
			encoding: `utf8`,
		}).split(`\n`)
		expect(entries).toContain(`package/${packed.main}`)
		expect(entries).toContain(`package/${packed.types}`)
		expect(entries).not.toContain(`package/dist/live-consumer`)
		expect(existsSync(archive)).toBe(true)
	} finally {
		rmSync(directory, { recursive: true, force: true })
	}
}, 60_000)
