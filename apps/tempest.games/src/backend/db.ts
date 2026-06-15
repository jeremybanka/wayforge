import type { Json } from "atom.io/foundations/json"

import { DatabaseManager } from "../database/tempest-db-manager"
import { logger } from "./logger"

export const db = new DatabaseManager({
	logQuery(query, params) {
		logger.info(`📝 query`, query, params)
	},
})
