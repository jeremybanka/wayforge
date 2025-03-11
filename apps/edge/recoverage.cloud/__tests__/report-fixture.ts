import type { CoverageMapData } from "istanbul-lib-coverage"
import type { JsonSummary } from "recoverage"

export const reportFixture = {
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
				line: 1,
				type: `if`,
				locations: [
					{
						start: { line: 1, column: 1 },
						end: { line: 1, column: 1 },
					},
				],
				loc: {
					start: { line: 1, column: 1 },
					end: { line: 1, column: 1 },
				},
			},
		},
		fnMap: {
			"1": {
				name: `test`,
				line: 1,
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

export const jsonSummaryFixture = {
	total: {
		branches: {
			total: 1,
			covered: 1,
			skipped: 0,
			pct: 100,
		},
		functions: {
			total: 1,
			covered: 1,
			skipped: 0,
			pct: 100,
		},
		lines: {
			total: 1,
			covered: 1,
			skipped: 0,
			pct: 100,
		},
		statements: {
			total: 1,
			covered: 1,
			skipped: 0,
			pct: 100,
		},
	},
} satisfies JsonSummary
