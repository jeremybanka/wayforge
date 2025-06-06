import type { RequestListener } from "node:http"

import type { Temporal } from "@js-temporal/polyfill"
import { initTRPC } from "@trpc/server"

import type { DatabaseManager } from "../database/tempest-db-manager"
import type { logger } from "./logger"

export type ContextAuth = { userId: string; sessionKey: string }

export interface Context {
	req: Parameters<RequestListener>[0]
	res: Parameters<RequestListener>[1]
	ip: string
	now: Temporal.Instant
	db: DatabaseManager
	logger: typeof logger
}

export const trpc = initTRPC.context<Context>().create()
