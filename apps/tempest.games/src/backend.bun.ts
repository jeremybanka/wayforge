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
import { eq, ne } from "drizzle-orm"
import * as SocketIO from "socket.io"
import { z } from "zod"

import { worker } from "./backend.worker"
import { DatabaseManager } from "./database/tempest-db-manager"
import { users } from "./database/tempest-db-schema"
import { asUUID } from "./library/as-uuid-node"
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

const signupSchema = z.object({
	email: z.string(),
	username: z.string(),
	password: z.string(),
})

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
				console.log(req.method, url.pathname)
				console.log({ signup: asUUID(`signup`), login: asUUID(`login`) })
				switch (req.method) {
					case `POST`:
						switch (url.pathname) {
							case `/signup-${asUUID(`signup`)}`:
								{
									console.log(`signup`)
									const text = Buffer.concat(data).toString()
									const json: Json.Serializable = JSON.parse(text)
									const parsed = signupSchema.safeParse(json)
									console.log(`signup parsed`, parsed)
									if (parsed.success) {
										console.log(`signup parsed`)
										const { username, password, email } = parsed.data
										const [maybeUser] = await db.drizzle
											.select()
											.from(users)
											.where(eq(users.email, email))
											.limit(1)
										console.log(`signup maybeUser`, maybeUser)
										if (maybeUser) {
											throw [400, `User already exists`]
										}
										const salt = crypto.randomUUID()
										const hash = createHash(`sha256`)
											.update(password + salt)
											.digest(`hex`)
										await db.drizzle
											.insert(users)
											.values({ username, email, hash, salt })
										console.log(`signup done`)
										res.writeHead(201, {
											"Content-Type": `text/plain`,
											"Access-Control-Allow-Origin": `${env.FRONTEND_ORIGINS[0]}`,
										})
										res.end(RESPONSE_DICTIONARY[201])
									}
								}
								break
							case `/login-${asUUID(`login`)}`: {
								const text = Buffer.concat(data).toString()
								const json: Json.Serializable = JSON.parse(text)
								const parsed = credentialsSchema.safeParse(json)
								console.log(`login parsed`, parsed)
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
									console.log(`login maybeUser`, maybeUser)
									if (maybeUser) {
										const { hash: trueHash, salt } = maybeUser
										const hash = createHash(`sha256`)
											.update(password + salt)
											.digest(`hex`)
										console.log(`login hash`, hash, `vs`, trueHash)
										if (hash === trueHash) {
											const sessionKey = crypto.randomUUID()
											let userSessions = userSessionMap.get(username)
											if (!userSessions) {
												userSessions = new Set()
												userSessionMap.set(username, userSessions)
											}
											userSessions.add(sessionKey)
											console.log(sessionKey, userSessions)

											res.setHeader(`Access-Control-Allow-Credentials`, `true`) // Allow cookies to be sent and received
											res.setHeader(
												`Access-Control-Allow-Headers`,
												`Content-Type`,
											)
											res.setHeader(`Set-Cookie`, [
												`username=${username}; HttpOnly; SameSite=Lax; Path=/; Domain=${env.FRONTEND_ORIGINS[0]}`,
												`sessionKey=${sessionKey}; HttpOnly; SameSite=Lax; Path=/; Domain=${env.FRONTEND_ORIGINS[0]}`,
											])
											res.writeHead(204, {
												"Content-Type": `text/plain`,
												"Access-Control-Allow-Origin": `${env.FRONTEND_ORIGINS[0]}`,
											})
											res.end(RESPONSE_DICTIONARY[204])
										}
									}
								}
							}
						}
				}
			} catch (thrown) {
				const result = serverIssueSchema.safeParse(thrown)
				console.log(`serverIssueSchema`, result)
				if (result.success) {
					const [code, message] = result.data
					const codeMeaning = RESPONSE_DICTIONARY[code]
					res.writeHead(code, {
						"Content-Type": `text/plain`,
						"Access-Control-Allow-Origin": `${env.FRONTEND_ORIGINS[0]}`,
					})
					res.end(`${codeMeaning}: ${message}`)
				} else {
					parent.logger.error(thrown)
					console.log(`serverIssueSchema`, result.error)
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
		credentials: true,
	},
})
	.use((socket, next) => {
		const cookieHeader = socket.handshake.headers.cookie
		if (!cookieHeader) {
			console.log(`No cookie header provided`)
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
