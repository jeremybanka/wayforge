export const reportFixture = {
	"/some/file.ts": {
		path: `/some/file.ts`,
		all: true,
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
			},
		},
		fnMap: {
			"1": {
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
}
