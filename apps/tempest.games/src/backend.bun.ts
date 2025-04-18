#!/usr/bin/env bun

import { createHTTPHandler } from "@trpc/server/adapters/standalone"
import { AtomIOLogger } from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import cors from "cors"
import { CronJob } from "cron"
import { Server as WebSocketServer } from "socket.io"

import { createServer } from "../dev/https-dev"
import { worker } from "./backend.worker"
import { logger, parentSocket } from "./backend/logger"
import { appRouter } from "./backend/router"
import { serveSocket, sessionMiddleware } from "./backend/websockets"
import { DatabaseManager } from "./database/tempest-db-manager"
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

const gameWorker = worker(parentSocket, `backend.worker.game.bun`, logger)

const db = new DatabaseManager({
	logQuery(query, params) {
		logger.info(`📝 query`, query, params)
	},
})

IMPLICIT.STORE.loggers[0] = new AtomIOLogger(`info`, undefined, logger)

const trpcHandler = createHTTPHandler({
	router: appRouter,
	middleware: cors({ origin: env.FRONTEND_ORIGINS }),
	createContext: ({ req, res }) => ({
		req,
		res,
		ip: req.socket.remoteAddress ?? ``,
		now: new Date(),
		db,
		logger,
	}),
})
const httpServer = createServer(trpcHandler)
const address = httpServer.listen(env.BACKEND_PORT).address()
if (!address || typeof address === `string`) {
	throw new Error(`Could not determine port for test server`)
}

new WebSocketServer(httpServer, {
	cors: {
		origin: env.FRONTEND_ORIGINS,
		methods: [`GET`, `POST`],
	},
})
	.use(sessionMiddleware)
	.on(`connection`, serveSocket)

async function gracefulExit() {
	logger.info(`🧹 closing workers`)
	const gameWorkerExit = new Promise((pass) =>
		gameWorker.process.once(`close`, pass),
	)
	gameWorker.emit(`timeToStop`)
	await gameWorkerExit
	logger.info(`🛬 backend server exiting`)
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
	parentSocket.on(`timeToStop`, async () => {
		logger.info(
			`❗ backend server received signal "timeToStop"; exiting gracefully`,
		)
		await gracefulExit()
	})
})

logger.info(`🛫 backend server ready on port ${env.BACKEND_PORT}`)

parentSocket.emit(`alive`)
