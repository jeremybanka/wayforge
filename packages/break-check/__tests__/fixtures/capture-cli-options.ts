import { mock } from "bun:test"

import type { BreakCheckOptions } from "../../src/break-check"

await mock.module(`../../src/break-check`, () => ({
	breakCheck: (options: BreakCheckOptions) => {
		process.stderr.write(JSON.stringify(options))
		return Promise.resolve({ breakingChangesFound: false })
	},
}))
