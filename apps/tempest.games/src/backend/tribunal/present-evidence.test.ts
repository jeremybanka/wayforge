import { resolve } from "node:path"

import { makeRulingOnLogs } from "./present-evidence"
import { processLogs } from "./process-logs"

describe(`tribunal`, () => {
	test(`makeRulingOnEvidence`, async () => {
		const logger = console
		const allLogsFromToday = await processLogs(
			console,
			resolve(import.meta.dirname, `sample.log`),
		)
		logger.info(allLogsFromToday)

		for (const [ip, ipLogs] of allLogsFromToday) {
			const ruling = await makeRulingOnLogs(logger, ipLogs)
			logger.info({ ip, ruling })
			break
		}
	})
})
