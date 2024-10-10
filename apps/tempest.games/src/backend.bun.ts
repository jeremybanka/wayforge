#!/usr/bin/env bun

import { log } from "node:console"
import { createHash } from "node:crypto"
import * as http from "node:http"

import { editRelationsInStore, findRelationsInStore } from "atom.io/data"
import {
	disposeFromStore,
	findInStore,
	getFromStore,
	IMPLICIT,
	setIntoStore,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import {
	realtimeContinuitySynchronizer,
	socketAtoms,
	socketIndex,
	userIndex,
	usersOfSockets,
} from "atom.io/realtime-server"
import { eq } from "drizzle-orm"
import * as SocketIO from "socket.io"
import { z } from "zod"

import { logger, parentSocket } from "./backend"
import { worker } from "./backend.worker"
import { userSessionMap } from "./backend/user-session-map"
import { DatabaseManager } from "./database/tempest-db-manager"
import {
	loginHistory,
	USERNAME_ALLOWED_CHARS,
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
	users,
} from "./database/tempest-db-schema"
import { asUUID } from "./library/as-uuid-node"
import { env } from "./library/env"
import {
	RESPONSE_DICTIONARY,
	responseCodeUnion,
} from "./library/response-dictionary"
import { countContinuity } from "./library/store"

const gameWorker = worker(parentSocket, `backend.worker.game.bun`, logger)

const credentialsSchema = z
	.object({
		username: z.string(),
		password: z.string(),
	})
	.strict()

const signupSchema = z.object({
	email: z.string().email(),
	username: z
		.string()
		.min(USERNAME_MIN_LENGTH)
		.max(USERNAME_MAX_LENGTH)
		.regex(USERNAME_ALLOWED_CHARS),
	password: z.string(),
})

const serverIssueSchema = z.tuple([responseCodeUnion, z.string()])

const db = new DatabaseManager()

const httpServer = http.createServer((req, res) => {
	let data: Uint8Array[]
	req
		.on(`data`, (chunk) => (data ??= []).push(chunk))
		.on(`end`, async () => {
			const authHeader = req.headers.authorization
			try {
				if (typeof req.url === `undefined`) throw [400, `No URL`]
				const ipAddress = req.socket.remoteAddress
				if (!ipAddress) throw [400, `No IP address`]

				const now = new Date().toISOString()
				const url = new URL(req.url, env.VITE_BACKEND_ORIGIN)
				logger.info(now, ipAddress, req.method, url.pathname)

				switch (req.method) {
					case `POST`:
						if (!data) {
							throw [400, `No data received`]
						}
						switch (url.pathname) {
							case `/signup-${asUUID(`signup`)}`:
								{
									const text = Buffer.concat(data).toString()
									const json: Json.Serializable = JSON.parse(text)
									logger.info(`signup json`, json)
									const parsed = signupSchema.safeParse(json)
									if (!parsed.success) {
										logger.warn(`signup parsed`, parsed.error.issues)
										return
									}
									const { username, password, email } = parsed.data
									const [maybeUser] = await db.drizzle
										.select()
										.from(users)
										.where(eq(users.email, email))
										.limit(1)
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
									res.writeHead(201, {
										"Content-Type": `text/plain`,
										"Access-Control-Allow-Origin": `${env.FRONTEND_ORIGINS[0]}`,
									})
									res.end(RESPONSE_DICTIONARY[201])
								}
								break
							case `/login-${asUUID(`login`)}`: {
								const text = Buffer.concat(data).toString()
								const json: Json.Serializable = JSON.parse(text)
								const zodParsed = credentialsSchema.safeParse(json)
								if (!zodParsed.success) {
									logger.warn(`login parsed`, zodParsed.error.issues)
									throw [400, `Could not log in.`]
								}
								const { username, password } = zodParsed.data
								const [maybeUser] = await db.drizzle
									.select({
										id: users.id,
										hash: users.hash,
										salt: users.salt,
									})
									.from(users)
									.where(eq(users.username, username))
									.limit(1)
								logger.info(`🔑 login attempt as user`, username)
								if (!maybeUser) {
									logger.info(`🔑 user ${username} does not exist`)
									throw [400, `Could not log in.`]
								}
								let successful = false
								const { hash: trueHash, salt } = maybeUser
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
									userSessions.set(sessionKey, Date.now())
									successful = true
									logger.info(`🔑 login successful as`, username)
									res.writeHead(200, {
										"Content-Type": `text/plain`,
										"Access-Control-Allow-Origin": `${env.FRONTEND_ORIGINS[0]}`,
									})
									res.end(`${username} ${sessionKey}`)
								}
								db.drizzle.insert(loginHistory).values({
									userId: maybeUser.id,
									ipAddress: ipAddress,
									successful,
									userAgent: req.headers[`user-agent`] ?? `Withheld`,
								})
							}
						}
				}
			} catch (thrown) {
				const result = serverIssueSchema.safeParse(thrown)
				if (result.success) {
					const [code, message] = result.data
					const codeMeaning = RESPONSE_DICTIONARY[code]
					logger.info(`❌ ${code}: ${message}`)
					res.writeHead(code, {
						"Content-Type": `text/plain`,
						"Access-Control-Allow-Origin": `${env.FRONTEND_ORIGINS[0]}`,
					})
					res.end(`${codeMeaning}: ${message}`)
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

new SocketIO.Server(httpServer, {
	cors: {
		origin: env.FRONTEND_ORIGINS,
		methods: [`GET`, `POST`],
	},
})
	.use((socket, next) => {
		const { username, sessionKey } = socket.handshake.auth
		if (!(username && sessionKey)) {
			next(new Error(`No auth header provided`))
			return
		}
		const userSessions = userSessionMap.get(username)
		if (userSessions?.has(sessionKey)) {
			const socketState = findInStore(IMPLICIT.STORE, socketAtoms, socket.id)
			setIntoStore(IMPLICIT.STORE, socketState, socket)
			editRelationsInStore(
				usersOfSockets,
				(relations) => {
					relations.set(socket.id, username)
				},
				IMPLICIT.STORE,
			)
			setIntoStore(IMPLICIT.STORE, userIndex, (index) => index.add(username))
			setIntoStore(IMPLICIT.STORE, socketIndex, (index) => index.add(socket.id))
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
			const userKeyState = findRelationsInStore(
				usersOfSockets,
				socket.id,
				IMPLICIT.STORE,
			).userKeyOfSocket
			const userKey = getFromStore(IMPLICIT.STORE, userKeyState)
			editRelationsInStore(
				usersOfSockets,
				(relations) => {
					relations.delete(socket.id)
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
				(index) => (index.delete(socket.id), index),
			)
			disposeFromStore(IMPLICIT.STORE, socketAtoms, socket.id)
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
	await new Promise((resolve) => gameWorker.process.once(`exit`, resolve))
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
