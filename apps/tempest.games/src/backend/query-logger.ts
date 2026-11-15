import { createHmac, randomBytes } from "node:crypto"

import type { Logger } from "drizzle-orm"

const operations = new Set([
	`select`,
	`insert`,
	`update`,
	`delete`,
	`with`,
	`begin`,
	`commit`,
	`rollback`,
])

/** Keep query diagnostics without sending SQL literals or bound values to logs. */
export function createQueryLogger(sink: Pick<Console, `info`>): Logger {
	// A process-local key prevents guessing secrets embedded in raw SQL from its
	// fingerprint. Fingerprints correlate identical statements only in this run.
	const key = randomBytes(32)
	return {
		logQuery(query, params) {
			const firstWord = /^\s*([a-z]+)/i.exec(query)?.[1]?.toLowerCase()
			sink.info(`📝 query`, {
				operation: firstWord && operations.has(firstWord) ? firstWord : `other`,
				queryId: createHmac(`sha256`, key).update(query).digest(`hex`),
				parameterCount: params.length,
				parameters: `[REDACTED]`,
			})
		},
	}
}
