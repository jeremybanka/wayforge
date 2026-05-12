#!/usr/bin/env node

import { execFileSync } from "node:child_process"
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"

const OUTPUT_DIR = `/private/tmp/atomio-coverage-runs-postfix`
const TARGET_FILE = resolve(
	process.cwd(),
	`packages/atom.io/src/realtime-server/realtime-mutable-provider.ts`,
)
const TARGET_LINES = [62, 63, 64, 65, 66, 67, 68, 69]

type CoverageEntry = {
	statementMap: Record<
		string,
		{
			start: { line: number }
			end: { line: number }
		}
	>
	s: Record<string, number>
}

rmSync(OUTPUT_DIR, { recursive: true, force: true })
mkdirSync(OUTPUT_DIR, { recursive: true })

const results: Array<{
	run: number
	targetCovered: Array<{ line: number; covered: boolean }>
}> = []

for (const run of [1, 2, 3]) {
	console.error(`=== RUN ${run} ===`)
	const output = execFileSync(
		`pnpm`,
		[`--filter`, `atom.io`, `run`, `test:coverage:once`],
		{
			cwd: process.cwd(),
			encoding: `utf8`,
			maxBuffer: 32 * 1024 * 1024,
		},
	)
	writeFileSync(join(OUTPUT_DIR, `run-${run}.log`), output)
	cpSync(
		resolve(process.cwd(), `packages/atom.io/coverage/coverage-final.json`),
		join(OUTPUT_DIR, `coverage-${run}.json`),
	)

	const coverageFile = JSON.parse(
		readFileSync(join(OUTPUT_DIR, `coverage-${run}.json`), `utf8`),
	) as Record<string, CoverageEntry>
	const entry = coverageFile[TARGET_FILE]
	const coveredLines = new Set<number>()
	for (const [statementId, location] of Object.entries(entry.statementMap)) {
		if ((entry.s[statementId] ?? 0) === 0) {
			continue
		}
		for (let line = location.start.line; line <= location.end.line; line++) {
			coveredLines.add(line)
		}
	}
	results.push({
		run,
		targetCovered: TARGET_LINES.map((line) => ({
			line,
			covered: coveredLines.has(line),
		})),
	})
}

console.log(JSON.stringify(results, null, 2))
