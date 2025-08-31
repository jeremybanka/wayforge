import path from "node:path"

import {
	editRelations,
	findRelations,
	findState,
	getInternalRelations,
	getState,
	runTransaction,
	setState,
} from "atom.io"
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

pipe(
	new SocketIO.Server(env.PORT, { cors: { origin: env.CLIENT_ORIGINS } }),
	(server) => {
		server.use((socket, next) => {
			const { token, username } = socket.handshake.auth
			const shortId = socket.id.slice(0, 3)
			if (token === `test` && socket.id) {
				const socketKey = `socket::${socket.id}` satisfies RTS.SocketKey
				const socketState = findState(RTS.socketAtoms, socketKey)
				setState(socketState, socket)
				const userKey = `user::${username}` satisfies RTS.UserKey
				editRelations(RTS.usersOfSockets, (relations) => {
					relations.set(userKey, socketKey)
				})
				setState(RTS.userIndex, (index) => index.add(userKey))
				setState(RTS.socketIndex, (index) => index.add(socketKey))
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
			const shortId = socket.id.slice(0, 3)
			const { username } = socket.handshake.auth
			const exposeMutable = RTS.realtimeMutableProvider({ socket })
			const exposeMutableFamily = RTS.realtimeMutableFamilyProvider({
				socket,
			})
			socket.onAny((...payload: [string, ...Json.Array]) => {
				logger.info(`🛰 `, username, ...payload)
			})
			socket.onAnyOutgoing((event, ...args) => {
				logger.info(`🛰  >>`, username, event, ...args)
			})

			exposeMutable(RT.roomIndex)

			const usersOfSocketsAtoms = getInternalRelations(RTS.usersOfSockets)
			exposeMutableFamily(usersOfSocketsAtoms, RTS.socketIndex)
			const usersInRoomsAtoms = getInternalRelations(RT.usersInRooms)
			exposeMutableFamily(usersInRoomsAtoms, RT.roomIndex)
			exposeMutable(findState(usersInRoomsAtoms, username))

			socket.on(`create-room`, async (roomId) => {
				await RTS.spawnRoom(roomId, `bun`, [
					// `--smol`,
					`--watch`,
					path.join(import.meta.dir, `room.server.ts`),
				])
			})

			socket.on(`delete-room`, (roomId) => {
				logger.info(`[${shortId}]:${username}`, `deleting room "${roomId}"`)
				RTS.deleteRoom(roomId)
				setState(RT.roomIndex, (index) => (index.delete(roomId), index))
			})

			socket.on(`join-room`, (roomId) => {
				logger.info(`[${shortId}]:${username}`, `joining room "${roomId}"`)
				const roomQueue: [string, ...Json.Array][] = []
				const pushToRoomQueue = (payload: [string, ...Json.Array]): void => {
					roomQueue.push(payload)
				}
				let toRoom = pushToRoomQueue
				const forward = (...payload: [string, ...Json.Array]) => {
					toRoom(payload)
				}
				socket.onAny(forward)

				runTransaction(RTS.joinRoomTX, nanoid())(roomId, username, 0)

				const roomSocket = RTS.ROOMS.get(roomId)!
				roomSocket.onAny((...payload) => socket.emit(...payload))
				roomSocket.emit(`user-joins`, username)

				toRoom = (payload) => {
					roomSocket.emit(`user:${username}`, ...payload)
				}
				while (roomQueue.length > 0) {
					const payload = roomQueue.shift()
					if (payload) toRoom(payload)
				}

				roomSocket.process.on(`close`, (code) => {
					logger.info(`[${shortId}]:${username}`, `room "${roomId}" closing`)
					socket.emit(`room-close`, roomId, code)
					runTransaction(RTS.destroyRoomTX)(roomId)
				})
				const leaveRoom = () => {
					socket.off(`user-leaves`, leaveRoom)
					socket.offAny(forward)
					// roomSocket.dispose() IMPLEMENT ❗
					toRoom([`user-leaves`])
					runTransaction(RTS.leaveRoomTX)(roomId, username)
				}

				socket.on(`leave-room`, leaveRoom)
				socket.on(`disconnect`, leaveRoom)
			})

			const handleDisconnect = () => {
				socket.off(`disconnect`, handleDisconnect)
				const roomKeyState = findRelations(
					RT.usersInRooms,
					username,
				).roomKeyOfUser
				const roomKey = getState(roomKeyState)
				if (!roomKey) {
					return
				}
				const roomSocket = RTS.ROOMS.get(roomKey)!
				roomSocket?.emit(`leave-room`, username)
				runTransaction(RTS.leaveRoomTX)(`*`, username)
				logger.info(`[${shortId}]:${username}`, `disconnected`)
			}
			socket.on(`disconnect`, handleDisconnect)
		})
	},
)
