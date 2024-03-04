import path from "path"
import { findState, getState, runTransaction, setState } from "atom.io"
import type { Json } from "atom.io/json"
import * as RT from "atom.io/realtime"
import * as RTS from "atom.io/realtime-server"
import { pipe } from "fp-ts/function"
import { nanoid } from "nanoid"
import * as SocketIO from "socket.io"

import { editRelations, findRelations, getInternalRelations } from "atom.io/data"
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
				editRelations(RTS.usersOfSockets, (relations) => {
					relations.set(socket.id, username)
				})
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

			socket.on(`create-room`, async (roomId) => {
				runTransaction(RTS.createRoomTX)(roomId, `bun`, [
					// `--smol`,
					`--watch`,
					path.join(import.meta.dir, `room.server.ts`),
				])
			})

			socket.on(`delete-room`, async (roomId) => {
				const roomState = findState(RTS.roomSelectors, roomId)
				const roomSocket = await getState(roomState)
				logger.info(`[${shortId}]:${username}`, `deleting room "${roomId}"`)
				roomSocket.emit(`exit`, username)
				setState(RT.roomIndex, (index) => (index.delete(roomId), index))
			})

			socket.on(`join-room`, async (roomId) => {
				logger.info(`[${shortId}]:${username}`, `joining room "${roomId}"`)
				const roomQueue: [string, ...Json.Array][] = []
				const pushToRoomQueue = (payload: [string, ...Json.Array]): void => {
					roomQueue.push(payload)
				}
				let toRoom = pushToRoomQueue
				const forward = (...payload: [string, ...Json.Array]) => toRoom(payload)
				socket.onAny(forward)

				runTransaction(RTS.joinRoomTX, nanoid())(roomId, username, 0)

				const roomSocketState = findState(RTS.roomSelectors, roomId)
				const roomSocket = await getState(roomSocketState)
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

			const handleDisconnect = async () => {
				socket.off(`disconnect`, handleDisconnect)
				const roomKeyState = findRelations(
					RT.usersInRooms,
					username,
				).roomKeyOfUser
				const roomKey = getState(roomKeyState)
				if (!roomKey) {
					return
				}
				const roomSocketState = findState(RTS.roomSelectors, roomKey)
				const roomSocket = await getState(roomSocketState)
				roomSocket?.emit(`leave-room`, username)
				runTransaction(RTS.leaveRoomTX)(`*`, username)
				logger.info(`[${shortId}]:${username}`, `disconnected`)
			}
			socket.on(`disconnect`, handleDisconnect)
		})
	},
)
