import { mock } from "bun:test"

import type { BreakCheckOptions } from "../../src/break-check"

await mock.module(`../../src/break-check`, () => ({
	breakCheckPrelude: () => {
		throw new Error(`The prelude must not run on the check route.`)
	},
	breakCheck: (options: BreakCheckOptions) => {
		process.stderr.write(JSON.stringify(options))
		return Promise.resolve({ breakingChangesFound: false })
	},
}))
