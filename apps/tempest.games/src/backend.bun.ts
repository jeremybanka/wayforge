#!/usr/bin/env bun

import type { RequestListener } from "node:http"
import { createServer as createHttpServer } from "node:http"
import { createServer as createSecureServer } from "node:https"

import { initTRPC, TRPCError } from "@trpc/server"
import { createHTTPHandler } from "@trpc/server/adapters/standalone"
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
import type { SocketKey, UserKey } from "atom.io/realtime-server"
import {
	prepareToExposeRealtimeContinuity,
	socketAtoms,
	socketIndex,
	userIndex,
	usersOfSockets,
} from "atom.io/realtime-server"
import cors from "cors"
import { CronJob } from "cron"
import { and, eq, gt } from "drizzle-orm"
import { Server as WebSocketServer } from "socket.io"

import { httpsDev } from "../dev/https-dev"
import { logger, parentSocket } from "./backend"
import { worker } from "./backend.worker"
import { userSessionMap } from "./backend/user-session-map"
import { DatabaseManager } from "./database/tempest-db-manager"
import { banishedIps, loginHistory, users } from "./database/tempest-db-schema"
import {
	credentialsType,
	signupType as signUpType,
} from "./library/data-constraints"
import { env } from "./library/env"
import { RESPONSE_DICTIONARY } from "./library/response-dictionary"
import { countContinuity } from "./library/store"

const gameWorker = worker(parentSocket, `backend.worker.game.bun`, logger)

const db = new DatabaseManager({
	logQuery(query, params) {
		logger.info(`📝 query`, query, params)
	},
})

IMPLICIT.STORE.loggers[0] = new AtomIOLogger(`info`, undefined, logger)

interface Context {
	req: Parameters<RequestListener>[0]
	res: Parameters<RequestListener>[1]
	ip: string
	now: Date
	db: DatabaseManager
	logger: typeof logger
}

const trpc = initTRPC.context<Context>().create()

export const appRouter = trpc.router({
	signUp: trpc.procedure.input(signUpType).mutation(async ({ input, ctx }) => {
		const { username, password, email } = input
		ctx.logger.info(`🔑 attempting to sign up:`, username)
		const maybeUser = await ctx.db.drizzle.query.users.findFirst({
			columns: { id: true },
			where: eq(users.emailVerified, email),
		})
		if (maybeUser) {
			throw new TRPCError({
				code: `BAD_REQUEST`,
				message: `This email was already verified on another account.`,
			})
		}
		const passwordHash = await Bun.password.hash(password, {
			algorithm: `bcrypt`,
			cost: 10,
		})
		await ctx.db.drizzle.insert(users).values({
			username,
			emailOffered: email,
			password: passwordHash,
			createdIp: ctx.ip,
		})
		ctx.logger.info(`🔑 user created:`, username)
		return { status: 201 }
	}),

	login: trpc.procedure
		.input(credentialsType)
		.mutation(async ({ input, ctx }) => {
			const { username, password } = input
			let successful = false
			let userId: string | null = null
			try {
				ctx.logger.info(`🔑 login attempt as user`, username)
				const tenMinutesAgo = new Date(+ctx.now - 1000 * 60 * 10)
				const recentFailures = await ctx.db.drizzle.query.loginHistory.findMany({
					columns: { userId: true, successful: true, loginTime: true },
					where: and(
						eq(loginHistory.ipAddress, ctx.ip),
						eq(loginHistory.successful, false),
						gt(loginHistory.loginTime, tenMinutesAgo),
					),
					limit: 10,
				})
				const attemptsRemaining = 10 - recentFailures.length
				const allUsers = await ctx.db.drizzle.query.users.findMany({
					columns: { id: true, username: true },
				})
				logger.info({ attemptsRemaining, allUsers })
				if (attemptsRemaining < 1) {
					// ban IP
					await ctx.db.drizzle.insert(banishedIps).values({
						ip: ctx.ip,
						reason: `Too many recent login attempts.`,
						banishedAt: ctx.now,
						banishedUntil: new Date(+ctx.now + 1000 * 60 * 60 * 24),
					})
					throw new TRPCError({
						code: `TOO_MANY_REQUESTS`,
						message: `Too many recent login attempts.`,
					})
				}
				const maybeUser = await ctx.db.drizzle.query.users.findFirst({
					columns: { id: true, password: true, emailVerified: true },
					where: eq(users.username, username),
				})
				if (!maybeUser) {
					throw new TRPCError({
						code: `BAD_REQUEST`,
						message: `${attemptsRemaining} attempts remaining.`,
					})
				}
				userId = maybeUser.id
				logger.info({
					password,
					maybeUser,
				})
				const match = await Bun.password.verify(password, maybeUser.password)
				if (!match) {
					throw new TRPCError({
						code: `BAD_REQUEST`,
						message: `${attemptsRemaining} attempts remaining.`,
					})
				}
				const sessionKey = crypto.randomUUID()
				let userSessions = userSessionMap.get(username)
				if (!userSessions) {
					userSessions = new Map()
					userSessionMap.set(username, userSessions)
				}
				const now = new Date()
				userSessions.set(sessionKey, +now)
				successful = true
				ctx.logger.info(`🔑 login successful as`, username)
				return {
					status: 200,
					username,
					sessionKey,
					verification: maybeUser.emailVerified
						? (`verified` as const)
						: (`unverified` as const),
				}
			} finally {
				logger.info(`finally`)
				await ctx.db.drizzle.insert(loginHistory).values({
					userId,
					successful,
					ipAddress: ctx.ip,
					userAgent: ctx.req.headers[`user-agent`] ?? `Withheld`,
					loginTime: ctx.now,
				})
				ctx.logger.info(`🔑 recorded login attempt from`, ctx.ip)
			}
		}),
})

export type AppRouter = typeof appRouter

// Create tRPC HTTP handler
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

// Daily tribunal cron job
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

function createServer(listener: RequestListener) {
	if (httpsDev) {
		return createSecureServer(httpsDev, listener)
	}
	return createHttpServer({}, listener)
}

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
