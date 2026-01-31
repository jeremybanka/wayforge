#!/usr/bin/env bun

import path from "node:path"

import { Temporal } from "@js-temporal/polyfill"
import { createHTTPHandler } from "@trpc/server/adapters/standalone"
import { AtomIOLogger } from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import { realtime } from "atom.io/realtime-server"
import cors from "cors"
import { Server as WebSocketServer, Socket } from "socket.io"

import { createServer } from "../dev/https-dev"
import { db } from "./backend/db"
import { logger, parentSocket } from "./backend/logger"
import { appRouter } from "./backend/trpc-app-router"
import type { Context } from "./backend/trpc-server"
import { serveSocket, sessionMiddleware } from "./backend/websockets"
import { env } from "./library/env"

IMPLICIT.STORE.loggers[0] = new AtomIOLogger(
	`info`,
	(...params) => {
		if (![`⭕`, `🔴`, `🟢`, `🚫`, `❌`, `👀`, `🙈`].includes(params[0])) {
			return false
		}
		let idx = 0
		for (const param of params) {
			if (param instanceof Socket) {
				params[idx] = `Socket:${param.id}`
			}
			idx++
		}
		return params
	},
	logger,
)

const trpcHandler = createHTTPHandler({
	router: appRouter,
	middleware: cors({ origin: env.FRONTEND_ORIGINS, credentials: true }),
	createContext: ({ req, res }) => {
		const context: Context = {
			req,
			res,
			ip: req.socket.remoteAddress ?? ``,
			now: Temporal.Now.instant(),
			db,
			logger,
		}
		return context
	},
})
const httpServer = createServer(trpcHandler)
httpServer.listen(env.BACKEND_PORT).address()

realtime(
	new WebSocketServer(httpServer, {
		cors: {
			origin: env.FRONTEND_ORIGINS,
			methods: [`GET`, `POST`],
			credentials: true,
		},
	}),
	sessionMiddleware,
	serveSocket,
)

async function gracefulExit() {
	logger.info(`🛬 backend server exiting`)
	await new Promise((pass) => setTimeout(pass, 10))
	process.exit(0)
}

process.on(`SIGINT`, async () => {
	logger.info(`❗ received SIGINT; exiting gracefully`)
	await gracefulExit()
})
process.on(`SIGTERM`, async () => {
	logger.info(`❗ received SIGTERM; exiting gracefully`)
	await gracefulExit()
})
process.on(`exit`, async () => {
	logger.info(`❗ received exit; exiting gracefully`)
	await gracefulExit()
})

parentSocket.on(`updatesReady`, () => {
	logger.info(`❗ backend server received signal "updatesReady"`)
	parentSocket.emit(`readyToUpdate`)
	logger.info(
		`❗ backend server has sent signal "readyToUpdate"; now awaits signal "timeToStop"`,
	)
})
parentSocket.on(`timeToStop`, async () => {
	logger.info(
		`❗ backend server received signal "timeToStop"; exiting gracefully`,
	)
	await gracefulExit()
})

const { version } = await Bun.file(
	path.resolve(import.meta.dir, `../package.json`),
).json()
logger.info(`🛫 backend v${version} ready on port ${env.BACKEND_PORT}`)

if (!env.RUN_WORKERS_FROM_SOURCE) parentSocket.emit(`alive`)
