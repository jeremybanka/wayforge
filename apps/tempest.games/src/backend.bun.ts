#!/usr/bin/env bun

import { createHash } from "node:crypto"
import type { RequestListener } from "node:http"
import { createServer as createHttpServer } from "node:http"
import { createServer as createSecureServer } from "node:https"

import { AtomIOLogger } from "atom.io"
import { editRelationsInStore, findRelationsInStore } from "atom.io/data"
import {
	disposeFromStore,
	findInStore,
	getFromStore,
	IMPLICIT,
	setIntoStore,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { SocketKey, UserKey } from "atom.io/realtime-server"
import {
	realtimeContinuitySynchronizer,
	socketAtoms,
	socketIndex,
	userIndex,
	usersOfSockets,
} from "atom.io/realtime-server"
import { CronJob } from "cron"
import { and, eq, gt } from "drizzle-orm"
import { Server as WebSocketServer } from "socket.io"

import { httpsDev } from "../dev/https-dev"
import { logger, parentSocket } from "./backend"
import { worker } from "./backend.worker"
import { userSessionMap } from "./backend/user-session-map"
import { DatabaseManager } from "./database/tempest-db-manager"
import { banishedIps, loginHistory, users } from "./database/tempest-db-schema"
import { asUUID } from "./library/as-uuid-node"
import { credentialsSchema, signupSchema } from "./library/data-constraints"
import { env } from "./library/env"
import {
	RESPONSE_DICTIONARY,
	serverIssueSchema,
} from "./library/response-dictionary"
import { countContinuity } from "./library/store"

const gameWorker = worker(parentSocket, `backend.worker.game.bun`, logger)

const db = new DatabaseManager()

IMPLICIT.STORE.loggers[0] = new AtomIOLogger(`info`, undefined, logger)

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

function createServer(requestListener: RequestListener) {
	if (httpsDev) {
		return createSecureServer(httpsDev, requestListener)
	}
	return createHttpServer({}, requestListener)
}

const httpServer = createServer((req, res) => {
	let data: Uint8Array[]
	req
		.on(`data`, (chunk) => (data ??= []).push(chunk))
		.on(`end`, async () => {
			const authHeader = req.headers.authorization
			try {
				if (typeof req.url === `undefined`) throw [400, `No URL`]
				const ipAddress = req.socket.remoteAddress
				if (!ipAddress) throw [400, `No IP address`]

				const now = new Date()
				const url = new URL(req.url, env.VITE_BACKEND_ORIGIN)
				logger.info(now, ipAddress, req.method, url.pathname)

				const ban = await db.drizzle.query.banishedIps.findFirst({
					columns: { banishedUntil: true },
					where: eq(banishedIps.ip, ipAddress),
				})
				const ipBannedIndefinitely = ban?.banishedUntil === null
				const ipBannedTemporarily = ban?.banishedUntil && ban.banishedUntil > now
				if (ipBannedIndefinitely || ipBannedTemporarily) {
					logger.info(`🙅 request from banned ip ${ipAddress}`)
					return
				}

				switch (req.method) {
					case `POST`:
						if (!data) {
							throw [400, `No data received`]
						}
						switch (url.pathname) {
							case `/sign-up-${asUUID(`sign-up`)}`:
								{
									const text = Buffer.concat(data).toString()
									const json: Json.Serializable = JSON.parse(text)
									const parsed = signupSchema.safeParse(json)
									if (!parsed.success) {
										logger.warn(`signup parsed`, parsed.error.issues)
										return
									}
									const { username, password, email } = parsed.data
									logger.info(`🔑 attempting to sign up: ${username}`)
									const maybeUser = await db.drizzle.query.users.findFirst({
										columns: { id: true },
										where: eq(users.email, email),
									})
									if (maybeUser) {
										throw [400, `User already exists`]
									}
									const salt = crypto.randomUUID()
									const hash = createHash(`sha256`)
										.update(password + salt)
										.digest(`hex`)
									await db.drizzle.insert(users).values({
										username,
										email,
										hash,
										salt,
										createdIp: ipAddress,
									})
									logger.info(`🔑 user created: ${username}`)
									res.writeHead(201, {
										"Content-Type": `text/plain`,
										"Access-Control-Allow-Origin": `${env.FRONTEND_ORIGINS[0]}`,
									})
									res.end(RESPONSE_DICTIONARY[201])
								}
								break
							case `/login-${asUUID(`login`)}`: {
								let successful = false
								let userId: string | null = null
								try {
									const tenMinutesAgo = new Date(+now - 1000 * 60 * 10)
									logger.info(`🔑 ten minutes ago`, {
										tenMinutesAgo,
										now,
									})
									const recentLoginHistory =
										await db.drizzle.query.loginHistory.findMany({
											columns: {
												userId: true,
												successful: true,
											},
											where: and(
												eq(loginHistory.ipAddress, ipAddress),
												eq(loginHistory.successful, false),
												gt(loginHistory.loginTime, tenMinutesAgo),
											),
											limit: 10,
										})

									logger.info(
										`🔑 ${recentLoginHistory.length}/10 recent failed logins from ${ipAddress}`,
									)

									const attemptsRemaining = 10 - recentLoginHistory.length
									if (attemptsRemaining < 1) {
										logger.info(
											`🔑 too many recent failed logins from ${ipAddress}`,
										)
										await db.drizzle.insert(banishedIps).values({
											ip: ipAddress,
											reason: `Too many recent login attempts.`,
											banishedAt: now,
											banishedUntil: new Date(+now + 1000 * 60 * 60 * 24),
										})
										throw [429, `Too many recent login attempts.`]
									}

									const text = Buffer.concat(data).toString()
									const json: Json.Serializable = JSON.parse(text)
									const zodParsed = credentialsSchema.safeParse(json)
									if (!zodParsed.success) {
										logger.warn(`login parsed`, zodParsed.error.issues)
										throw [400, `${attemptsRemaining} attempts remaining.`]
									}
									const { username, password } = zodParsed.data
									const maybeUser = await db.drizzle.query.users.findFirst({
										columns: {
											id: true,
											hash: true,
											salt: true,
										},
										where: eq(users.username, username),
									})
									logger.info(`🔑 login attempt as user`, username)
									if (!maybeUser) {
										logger.info(`🔑 user ${username} does not exist`)
										throw [400, `${attemptsRemaining} attempts remaining.`]
									}
									const { hash: trueHash, salt } = maybeUser
									userId = maybeUser.id
									const hash = createHash(`sha256`)
										.update(password + salt)
										.digest(`hex`)
									if (hash === trueHash) {
										const sessionKey = crypto.randomUUID()
										let userSessions = userSessionMap.get(username)
										if (!userSessions) {
											userSessions = new Map()
											userSessionMap.set(username, userSessions)
										}
										userSessions.set(sessionKey, Number(now))
										successful = true
										logger.info(`🔑 login successful as`, username)
										res.writeHead(200, {
											"Content-Type": `text/plain`,
											"Access-Control-Allow-Origin": `${env.FRONTEND_ORIGINS[0]}`,
										})
										res.end(`${username} ${sessionKey}`)
									}
								} finally {
									await db.drizzle.insert(loginHistory).values({
										userId,
										successful,
										ipAddress,
										userAgent: req.headers[`user-agent`] ?? `Withheld`,
									})
									logger.info(`🔑 recorded login attempt from ${ipAddress}`)
								}
							}
						}
				}
			} catch (thrown) {
				const result = serverIssueSchema.safeParse(thrown)
				if (result.success) {
					const [code, message] = result.data
					const codeMeaning = RESPONSE_DICTIONARY[code]
					const responseText = `${codeMeaning}. ${message}`
					logger.info(`❌ ${code}: ${responseText}`)
					res.writeHead(code, {
						"Content-Type": `text/plain`,
						"Access-Control-Allow-Origin": `${env.FRONTEND_ORIGINS[0]}`,
					})
					res.end(responseText)
				} else {
					logger.error(thrown)
					res.writeHead(500, {
						"Content-Type": `text/plain`,
						"Access-Control-Allow-Origin": `${env.FRONTEND_ORIGINS[0]}`,
					})
					res.end(`Internal Server Error`)
				}
			}
		})
})
const address = httpServer.listen(env.BACKEND_PORT).address()
const port =
	typeof address === `string` ? null : address === null ? null : address.port
if (port === null) throw new Error(`Could not determine port for test server`)

new WebSocketServer(httpServer, {
	cors: {
		origin: env.FRONTEND_ORIGINS,
		methods: [`GET`, `POST`],
	},
})
	.use((socket, next) => {
		const { username, sessionKey } = socket.handshake.auth as {
			username: string
			sessionKey: string
		}
		if (!(username && sessionKey)) {
			next(new Error(`No auth header provided`))
			return
		}
		const userKey = `user::${username}` satisfies UserKey
		const socketKey = `socket::${socket.id}` satisfies SocketKey

		const userSessions = userSessionMap.get(username)
		if (userSessions?.has(sessionKey)) {
			const socketState = findInStore(IMPLICIT.STORE, socketAtoms, socketKey)
			setIntoStore(IMPLICIT.STORE, socketState, socket)
			editRelationsInStore(
				usersOfSockets,
				(relations) => {
					relations.set(userKey, socketKey)
				},
				IMPLICIT.STORE,
			)
			setIntoStore(IMPLICIT.STORE, userIndex, (index) => index.add(userKey))
			setIntoStore(IMPLICIT.STORE, socketIndex, (index) => index.add(socketKey))
			logger.info(`${username} connected on ${socket.id}`)
			next()
		} else {
			logger.info(`${username} couldn't authenticate`)
			next(new Error(`Authentication error`))
		}
	})
	.on(`connection`, (socket) => {
		const syncContinuity = realtimeContinuitySynchronizer({
			socket,
			store: IMPLICIT.STORE,
		})
		const cleanup = syncContinuity(countContinuity)
		socket.on(`disconnect`, () => {
			const socketKey = `socket::${socket.id}` satisfies SocketKey
			const userKeyState = findRelationsInStore(
				usersOfSockets,
				socketKey,
				IMPLICIT.STORE,
			).userKeyOfSocket
			const userKey = getFromStore(IMPLICIT.STORE, userKeyState)
			editRelationsInStore(
				usersOfSockets,
				(relations) => {
					relations.delete(socketKey)
				},
				IMPLICIT.STORE,
			)
			if (userKey) {
				setIntoStore(
					IMPLICIT.STORE,
					userIndex,
					(index) => (index.delete(userKey), index),
				)
			}
			setIntoStore(
				IMPLICIT.STORE,
				socketIndex,
				(index) => (index.delete(socketKey), index),
			)
			logger.info(`${socket.id} disconnected`)
			cleanup()
		})
	})

parentSocket.emit(`alive`)
parentSocket.on(`updatesReady`, () => {
	parentSocket.emit(`readyToUpdate`)
})

async function gracefulExit() {
	logger.info(`🧹 dispatching SIGINT to workers`)
	gameWorker.process.kill(`SIGINT`)
	await new Promise((pass) => gameWorker.process.once(`exit`, pass))
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

logger.info(`🛫 backend server ready on port ${env.BACKEND_PORT}`)
