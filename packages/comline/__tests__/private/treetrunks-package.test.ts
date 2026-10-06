import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { stageTreeTrunks } from "../../test-infrastructure/source-workspace"

test(`installed CLI fixtures build a usable TreeTrunks package in isolation`, () => {
	const workspace = mkdtempSync(path.join(tmpdir(), `comline-treetrunks-`))
	try {
		const staged = stageTreeTrunks(
			path.resolve(import.meta.dirname, `../..`),
			workspace,
			(args, cwd) => {
				execFileSync(`pnpm`, args, { cwd, stdio: `pipe`, timeout: 60_000 })
			},
		)
		const manifest = JSON.parse(
			readFileSync(path.join(staged, `package.json`), `utf8`),
		)
		expect(
			readFileSync(path.join(staged, manifest.types), `utf8`).length,
		).toBeGreaterThan(0)
		const output = execFileSync(
			`node`,
			[
				`--input-type=module`,
				`--eval`,
				`import { required } from ${JSON.stringify(path.join(staged, manifest.main))}; console.log(typeof required)`,
			],
			{ encoding: `utf8` },
		)
		expect(output.trim()).toBe(`function`)
	} finally {
		rmSync(workspace, { recursive: true, force: true })
	}
})
