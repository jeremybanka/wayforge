#!/usr/bin/env bun

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
import {
	ParentSocket,
	realtimeContinuitySynchronizer,
	socketAtoms,
	socketIndex,
	userIndex,
	usersOfSockets,
} from "atom.io/realtime-server"
import * as SocketIO from "socket.io"

import { worker } from "./backend.worker"
import { MODE } from "./library/const"
import { countContinuity } from "./library/store"

const parent = new ParentSocket()
IMPLICIT.STORE.loggers[0] = new AtomIOLogger(`warn`, undefined, parent.logger)

const gameWorker = worker(parent, `backend.worker.game.bun`)

const httpServer = http.createServer((_, res) => res.end(`Hello World!`))
const address = httpServer.listen(4444).address()
const port =
	typeof address === `string` ? null : address === null ? null : address.port
if (port === null) throw new Error(`Could not determine port for test server`)

new SocketIO.Server(httpServer, {
	cors: {
		origin:
			MODE === `development` ? `http://localhost:3333` : `https://tempest.games`,
		methods: [`GET`, `POST`],
	},
})
	.use((socket, next) => {
		const { token, username } = socket.handshake.auth
		if (token === `test` && socket.id) {
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
