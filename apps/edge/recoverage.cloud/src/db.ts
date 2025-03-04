import type { D1Database } from "@cloudflare/workers-types/experimental"
import type { DrizzleD1Database } from "drizzle-orm/d1"
import { drizzle } from "drizzle-orm/d1"

import * as schema from "./schema"

export function createDatabase(
	db: D1Database,
): DrizzleD1Database<typeof schema> {
	return drizzle(db, {
		schema,
		logger: {
			logQuery(query, params) {
				console.info(`📝 query`, query, params)
			},
		},
	})
}
