import path from "path"
import { findState, getState, runTransaction, setState } from "atom.io"
import type { Json } from "atom.io/json"
import * as RT from "atom.io/realtime"
import * as RTS from "atom.io/realtime-server"
import { pipe } from "fp-ts/function"
import { nanoid } from "nanoid"
import * as SocketIO from "socket.io"

import { env } from "./env"
import { logger } from "./logger"
import { welcome } from "./welcome"

welcome(logger)

const TIMESTAMP = Date.now()

pipe(
	new SocketIO.Server(env.PORT, { cors: { origin: env.CLIENT_ORIGINS } }),
	(server) => {
		server.use((socket, next) => {
			const { token, username } = socket.handshake.auth
			const shortId = socket.id.slice(0, 3)
			if (token === `test` && socket.id) {
				const socketState = findState(RTS.socketAtoms, socket.id)
				setState(socketState, socket)
				RTS.usersOfSockets.relations.set(socket.id, username)
				setState(RTS.userIndex, (index) => index.add(username))
				setState(RTS.socketIndex, (index) => index.add(socket.id))
				logger.info(`[${shortId}]:${username}`, `connected`)
				next()
			} else {
				logger.info(`[${shortId}]:???`, `couldn't authenticate as "${username}"`)
				next(new Error(`Authentication error`))
			}
		})
		return server
	},
	(server) => {
		server.on(`connection`, (socket) => {
			const exposeMutable = RTS.realtimeMutableProvider({ socket })
			const exposeMutableFamily = RTS.realtimeMutableFamilyProvider({
				socket,
			})

			const userKeyState = findState(
				RTS.usersOfSockets.states.userKeyOfSocket,
				socket.id,
			)
			const userKey = getState(userKeyState)

			exposeMutable(RT.roomIndex)

			exposeMutableFamily(
				RTS.usersOfSockets.core.findRelatedKeysState,
				RTS.socketIndex,
			)
			exposeMutableFamily(
				RT.usersInRooms.core.findRelatedKeysState,
				RT.roomIndex,
			)

			socket.on(`create-room`, async (roomId) => {
				runTransaction(RTS.createRoomTX)(roomId, `bun`, [
					`--smol`,
					`--watch`,
					path.join(import.meta.dir, `room.server.ts`),
				])
			})

			socket.on(`delete-room`, async (roomId) => {
				const roomState = findState(RTS.roomSelectors, roomId)
				const roomSocket = await getState(roomState)
				roomSocket.emit(`exit`, userKey)
				setState(RT.roomIndex, (index) => (index.delete(roomId), index))
			})

			socket.on(`join-room`, async (roomId) => {
				if (!userKey) throw new Error(`User not found`)
				const roomQueue: [string, ...Json.Array][] = []
				let toRoom = (payload: [string, ...Json.Array]): void => {
					roomQueue.push(payload)
				}
				socket.onAny((...payload: [string, ...Json.Array]) => {
					console.log(`🛰 `, userKey, ...payload)
					toRoom(payload)
				})
				socket.onAnyOutgoing((event, ...args) => {
					console.log(`🛰  >>`, userKey, event, ...args)
				})

				runTransaction(RTS.joinRoomTX, nanoid())(roomId, userKey, 0)

				const roomSocketState = findState(RTS.roomSelectors, roomId)
				const roomSocket = await getState(roomSocketState)

				roomSocket.emit(`setup-relay`, userKey)

				toRoom = (payload) => {
					roomSocket.emit(`relay:${userKey}`, ...payload)
				}
				while (roomQueue.length > 0) {
					const payload = roomQueue.shift()
					if (payload) toRoom(payload)
				}

				roomSocket.onAny((...payload) => socket.emit(...payload))

				roomSocket.process.on(`close`, (code) => {
					console.log(`${roomId} exited with code ${code}`)
					socket.emit(`room-close`, roomId, code)
				})
			})

			socket.on(`leave-room`, async (roomId) => {
				if (!userKey) {
					console.error(`User not found`)
					return
				}
				runTransaction(RTS.leaveRoomTX)(roomId, userKey)
			})
			socket.on(`disconnect`, async () => {
				if (!userKey) {
					console.error(`User not found`)
					return
				}
				const roomKeyState = findState(
					RT.usersInRooms.states.roomKeyOfUser,
					userKey,
				)
				const roomKey = getState(roomKeyState)
				if (!roomKey) {
					return
				}
				const roomSocketState = findState(RTS.roomSelectors, roomKey)
				const roomSocket = await getState(roomSocketState)
				roomSocket?.emit(`leave-room`, userKey)
				runTransaction(RTS.leaveRoomTX)(`*`, userKey)
				logger.info(`[${socket.id}]:${userKey}`, `disconnected`)
			})
		})
	},
)
