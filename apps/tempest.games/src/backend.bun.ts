#!/usr/bin/env bun

import path from "node:path"

import { Temporal } from "@js-temporal/polyfill"
import { createHTTPHandler } from "@trpc/server/adapters/standalone"
import { AtomIOLogger } from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import cors from "cors"
import { CronJob } from "cron"
import { Server as WebSocketServer, Socket } from "socket.io"

import { createServer } from "../dev/https-dev"
import { worker } from "./backend.worker"
import { db } from "./backend/db"
import { logger, parentSocket } from "./backend/logger"
import { appRouter } from "./backend/router"
import type { Context } from "./backend/trpc-server"
import { serveSocket, sessionMiddleware } from "./backend/websockets"
import { env } from "./library/env"

export const tribunalDaily: CronJob = (() => {
	let { __tribunalDaily } = globalThis as any
	if (!__tribunalDaily) {
		__tribunalDaily = new CronJob(`00 15 * * * *`, () => {
			worker(parentSocket, `backend.worker.tribunal.bun`, logger)
		})
		__tribunalDaily.start()
		process.on(`exit`, () => {
			__tribunalDaily.stop()
			logger.info(`⌛ tribunal daily cronjob stopped`)
		})
		logger.info(`⏳ tribunal daily cronjob started`)
	}
	return __tribunalDaily
})()

// const gameWorker = worker(parentSocket, `backend.worker.game.bun`, logger)

IMPLICIT.STORE.loggers[0] = new AtomIOLogger(
	`info`,
	(...params) => {
		if (![`⭕`, `🔴`, `🟢`, `🚫`, `❌`].includes(params[0])) {
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

new WebSocketServer(httpServer, {
	cors: {
		origin: env.FRONTEND_ORIGINS,
		methods: [`GET`, `POST`],
		credentials: true,
	},
})
	.use(sessionMiddleware)
	.on(`connection`, serveSocket)

async function gracefulExit() {
	// logger.info(`🧹 closing workers`)
	// const gameWorkerExit = new Promise((pass) =>
	// 	gameWorker.proc.once(`close`, pass),
	// )
	// gameWorker.emit(`timeToStop`)
	// await gameWorkerExit
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

parentSocket.emit(`alive`)
