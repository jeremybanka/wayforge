#!/usr/bin/env bun

import type { RequestListener } from "node:http"
import { createServer as createHttpServer } from "node:http"
import { createServer as createSecureServer } from "node:https"

import { type } from "arktype"
import { AtomIOLogger } from "atom.io"
import {
	editRelationsInStore,
	findInStore,
	findRelationsInStore,
	getFromStore,
	IMPLICIT,
	setIntoStore,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { SocketKey, UserKey } from "atom.io/realtime-server"
import {
	prepareToExposeRealtimeContinuity,
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
import { credentialsType, signupType } from "./library/data-constraints"
import { env } from "./library/env"
import {
	RESPONSE_DICTIONARY,
	serverIssueType,
} from "./library/response-dictionary"
import { countContinuity } from "./library/store"

const gameWorker = worker(parentSocket, `backend.worker.game.bun`, logger)

const db = new DatabaseManager({
	logQuery(query, params) {
		logger.info(`📝 query`, query, params)
	},
})

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
									const parsed = signupType(json)
									if (parsed instanceof type.errors) {
										logger.warn(`signup parsed`, parsed)
										throw [400, `Signup failed`]
									}
									const { username, password, email } = parsed
									logger.info(`🔑 attempting to sign up: ${username}`)
									const maybeUser = await db.drizzle.query.users.findFirst({
										columns: { id: true },
										where: eq(users.emailVerified, email),
									})
									if (maybeUser) {
										throw [
											400,
											`This email was already verified on another account.`,
										]
									}
									const passwordHash = await Bun.password.hash(password, {
										algorithm: `bcrypt`,
										cost: 10,
									})
									await db.drizzle.insert(users).values({
										username,
										emailOffered: email,
										password: passwordHash,
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
							case `/login-${asUUID(`login`)}`:
								{
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
										const parsed = credentialsType(json)
										if (parsed instanceof type.errors) {
											logger.warn(`login parsed`, parsed)
											throw [400, `${attemptsRemaining} attempts remaining.`]
										}
										const { username, password } = parsed
										const maybeUser = await db.drizzle.query.users.findFirst({
											columns: {
												id: true,
												password: true,
											},
											where: eq(users.username, username),
										})
										logger.info(`🔑 login attempt as user`, username)
										if (!maybeUser) {
											logger.info(`🔑 user ${username} does not exist`)
											throw [400, `${attemptsRemaining} attempts remaining.`]
										}
										const { password: trueHash } = maybeUser
										userId = maybeUser.id
										const passwordDoesMatch = await Bun.password.verify(
											password,
											trueHash,
										)
										if (passwordDoesMatch) {
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
								break
							default:
								throw [404, `Not found`]
						}
						break
					case undefined:
						throw [400, `No Method`]
					default:
						throw [405, `Method not allowed`]
				}
			} catch (thrown) {
				const result = serverIssueType(thrown)
				if (result instanceof type.errors) {
					logger.error(thrown)
					res.writeHead(500, {
						"Content-Type": `text/plain`,
						"Access-Control-Allow-Origin": `${env.FRONTEND_ORIGINS[0]}`,
					})
					res.end(`Internal Server Error`)
				} else {
					const [code, message] = result
					const codeMeaning = RESPONSE_DICTIONARY[code]
					const responseText = `${codeMeaning}. ${message}`
					logger.info(`❌ ${code}: ${responseText}`)
					res.writeHead(code, {
						"Content-Type": `text/plain`,
						"Access-Control-Allow-Origin": `${env.FRONTEND_ORIGINS[0]}`,
					})
					res.end(responseText)
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
		const syncContinuity = prepareToExposeRealtimeContinuity({
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
