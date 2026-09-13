import { mock } from "bun:test"

import type { BreakCheckOptions } from "../../src/break-check"

mock.module(`../../src/break-check`, () => ({
	breakCheck: async (options: BreakCheckOptions) => {
		process.stderr.write(JSON.stringify(options))
		return { breakingChangesFound: false }
	},
}))
