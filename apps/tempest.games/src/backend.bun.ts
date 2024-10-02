#!/usr/bin/env bun

import { createHash } from "node:crypto"
import * as http from "node:http"

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
import {
	ParentSocket,
	realtimeContinuitySynchronizer,
	socketAtoms,
	socketIndex,
	userIndex,
	usersOfSockets,
} from "atom.io/realtime-server"
import { eq } from "drizzle-orm"
import * as SocketIO from "socket.io"
import { z } from "zod"

import { worker } from "./backend.worker"
import { DatabaseManager } from "./database/tempest-db-manager"
import { users } from "./database/tempest-db-schema"
import { asUUID } from "./library/as-uuid"
import { env } from "./library/env"
import {
	RESPONSE_DICTIONARY,
	responseCodeUnion,
} from "./library/response-dictionary"
import { countContinuity } from "./library/store"

const parent = new ParentSocket()
IMPLICIT.STORE.loggers[0] = new AtomIOLogger(`warn`, undefined, parent.logger)

const gameWorker = worker(parent, `backend.worker.game.bun`)

const credentialsSchema = z
	.object({
		username: z.string(),
		password: z.string(),
	})
	.strict()

const serverIssueSchema = z.tuple([responseCodeUnion, z.string()])

const db = new DatabaseManager()

const userSessionMap = new Map<string, Set<string>>()

const httpServer = http.createServer((req, res) => {
	const data: Uint8Array[] = []
	req
		.on(`data`, (chunk) => data.push(chunk))
		.on(`end`, async () => {
			const authHeader = req.headers.authorization
			try {
				if (typeof req.url === `undefined`) throw [400, `No URL`]
				const url = new URL(req.url, env.VITE_BACKEND_ORIGIN)
				switch (req.method) {
					case `POST`:
						switch (url.pathname) {
							case `/login-${asUUID(`login`)}`: {
								const text = Buffer.concat(data).toString()
								const json: Json.Serializable = JSON.parse(text)
								const parsed = credentialsSchema.safeParse(json)
								if (parsed.success) {
									const { username, password } = parsed.data
									const [maybeUser] = await db.drizzle
										.select({
											hash: users.hash,
											salt: users.salt,
										})
										.from(users)
										.where(eq(users.username, username))
										.limit(1)
									if (maybeUser) {
										const { hash: trueHash, salt } = maybeUser
										const hash = createHash(`sha256`)
											.update(password + salt)
											.digest(`hex`)
										if (hash === trueHash) {
											const sessionKey = crypto.randomUUID()
											let userSessions = userSessionMap.get(username)
											if (!userSessions) {
												userSessions = new Set()
												userSessionMap.set(username, userSessions)
											}
											userSessions.add(sessionKey)
											res.writeHead(204, { "Content-Type": `text/plain` })
											res.write(
												`Set-Cookie: username=${username}; HttpOnly; SameSite=Strict; Path=/`,
											)
											res.end(
												`Set-Cookie: sessionKey=${sessionKey}; HttpOnly; SameSite=Strict; Path=/`,
											)
										}
									}
								}
							}
						}
				}
			} catch (thrown) {
				const result = serverIssueSchema.safeParse(thrown)
				if (result.success) {
					const [code, message] = result.data
					const codeMeaning = RESPONSE_DICTIONARY[code]
					res.writeHead(code, { "Content-Type": `text/plain` })
					res.end(`${codeMeaning}: ${message}`)
				} else {
					parent.logger.error(thrown)
					res.writeHead(500, { "Content-Type": `text/plain` })
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
		const cookieHeader = socket.handshake.headers.cookie
		if (!cookieHeader) {
			next(new Error(`No cookie header provided`))
			return
		}

		const cookies = cookieHeader
			.split(`;`)
			.map((cookie) => cookie.trim())
			.reduce(
				(acc, cookie) => {
					// Check if the cookie contains an '=' character
					const separatorIndex = cookie.indexOf(`=`)
					if (separatorIndex < 0) {
						// Malformed cookie, log and skip it
						parent.logger.warn(`Malformed cookie: ${cookie}`)
						return acc
					}

					const key = cookie.slice(0, separatorIndex).trim()
					const value = cookie.slice(separatorIndex + 1).trim()

					// Skip if key is empty
					if (!key) {
						parent.logger.warn(`Cookie with empty key: ${cookie}`)
						return acc
					}

					// Decode URI components to handle encoded characters
					const decodedKey = decodeURIComponent(key)
					const decodedValue = decodeURIComponent(value)

					acc[decodedKey] = decodedValue
					return acc
				},
				{} as Partial<Record<`sessionKey` | `username`, string>>,
			)

		const { username, sessionKey } = cookies
		if (!(username && sessionKey)) {
			next(new Error(`No username or session key provided`))
			return
		}
		const userSessions = userSessionMap.get(username)
		if (!userSessions?.has(sessionKey)) {
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
			parent.logger.info(`${username} connected on ${socket.id}`)
			next()
		} else {
			parent.logger.info(`${username} couldn't authenticate`)
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
			parent.logger.info(`${socket.id} disconnected`)
			cleanup()
		})
	})

parent.emit(`alive`)
parent.on(`updatesReady`, () => {
	parent.emit(`readyToUpdate`)
})

async function gracefulExit() {
	parent.logger.info(`🧹 dispatching SIGINT to workers`)
	gameWorker.process.kill(`SIGINT`)
	await new Promise((resolve) => gameWorker.process.once(`exit`, resolve))
	parent.logger.info(`🛬 backend server exiting`)
	process.exit(0)
}

process.on(`SIGINT`, async () => {
	parent.logger.info(`❗ received SIGINT; exiting gracefully`)
	await gracefulExit()
})
process.on(`SIGTERM`, async () => {
	parent.logger.info(`❗ received SIGTERM; exiting gracefully`)
	await gracefulExit()
})
process.on(`exit`, async () => {
	parent.logger.info(`❗ received exit; exiting gracefully`)
	await gracefulExit()
})

parent.logger.info(`🛫 backend server ready`)
