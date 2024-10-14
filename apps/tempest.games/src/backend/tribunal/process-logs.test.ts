import console from "node:console"
import { resolve } from "node:path"

import { processLogs } from "./process-logs"

describe(`tribunal`, () => {
	test(`processLogs`, () => {
		processLogs(console, resolve(import.meta.dirname, `sample.log`))
	})
})
