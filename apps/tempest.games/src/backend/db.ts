import { DatabaseManager } from "../database/tempest-db-manager"
import { logger } from "./logger"
import { createQueryLogger } from "./query-logger"

export const db = new DatabaseManager(createQueryLogger(logger))
