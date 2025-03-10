const reportFixture = {
	"/some/file.ts": {
		path: `/some/file.ts`,
		statementMap: {
			"1": {
				start: { line: 1, column: 1 },
				end: { line: 1, column: 1 },
			},
		},
		branchMap: {
			"1": {
				loc: {
					start: { line: 1, column: 1 },
					end: { line: 1, column: 1 },
				},
				line: 1,
				type: `if`,
				locations: [
					{
						start: { line: 1, column: 1 },
						end: { line: 1, column: 1 },
					},
				],
			},
		},
		fnMap: {
			"1": {
				line: 1,
				name: `test`,
				decl: {
					start: { line: 1, column: 1 },
					end: { line: 1, column: 1 },
				},
				loc: {
					start: { line: 1, column: 1 },
					end: { line: 1, column: 1 },
				},
			},
		},
		s: { "1": 1 },
		f: { "1": 1 },
		b: { "1": [1] },
	},
} satisfies CoverageMapData

import type { CoverageMapData } from "istanbul-lib-coverage"
import { createCoverageMap } from "istanbul-lib-coverage"
import { Context, createContext } from "istanbul-lib-report"
import reports from "istanbul-reports"

import { VirtualFileWriter } from "../src/istanbul-writer"

test(`coverage writer`, () => {
	const coverageMap = createCoverageMap(reportFixture)
	const context = createContext({
		coverageMap,
	})
	const writer = new VirtualFileWriter(`/`)
	context.data.writer = writer
	for (const prop in context.writer) {
		console.log(prop)
	}
	const report = reports.create(`text`, {
		file: `coverage.txt`,
	})
	report.execute(context)

	console.log(context.writer)
	console.log(writer.vfs.get(``))
})
