import type { Json } from "atom.io/json"

import { DatabaseManager } from "../database/tempest-db-manager"
import { logger } from "./logger"

export const db = new DatabaseManager({
	logQuery(query, params) {
		logger.info(`📝 query`, query, params as Json.Serializable)
	},
})
