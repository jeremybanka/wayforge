import type { RequestListener } from "node:http"

import { initTRPC } from "@trpc/server"

import type { DatabaseManager } from "../database/tempest-db-manager"
import type { logger } from "./logger"
import { login } from "./routes/login"
import { signUp } from "./routes/sign-up"

interface Context {
	req: Parameters<RequestListener>[0]
	res: Parameters<RequestListener>[1]
	ip: string
	now: Date
	db: DatabaseManager
	logger: typeof logger
}

export const trpc = initTRPC.context<Context>().create()

export const appRouter = trpc.router({
	signUp,
	login,
})

export type AppRouter = typeof appRouter
