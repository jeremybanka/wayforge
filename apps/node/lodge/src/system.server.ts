import path from "path"
import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import * as RT from "atom.io/realtime"
import * as RTS from "atom.io/realtime-server"
import { pipe } from "fp-ts/function"
// import { arbitrary } from "atom.io/internal"
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
				const socketState = AtomIO.findState(RTS.socketAtoms, socket.id)
				AtomIO.setState(socketState, socket)
				RTS.usersOfSockets.relations.set(socket.id, username)
				AtomIO.setState(RTS.userIndex, (index) => index.add(username))
				AtomIO.setState(RTS.socketIndex, (index) => index.add(socket.id))
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

			const userKeyState = AtomIO.findState(
				RTS.usersOfSockets.states.userKeyOfSocket,
				socket.id,
			)
			const userKey = AtomIO.getState(userKeyState)

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
				console.log(`🏠`, userKey, `create-room`, roomId)
				AtomIO.runTransaction(RTS.createRoomTX, nanoid())(roomId, `bun`, [
					path.join(import.meta.dir, `room.server.ts`),
				])
			})

			const roomQueue: [string, ...Json.Array][] = []
			let toRoom = (payload: [string, ...Json.Array]): void => {
				roomQueue.push(payload)
			}

			socket.on(`join-room`, async (roomId) => {
				if (!userKey) throw new Error(`User not found`)

				AtomIO.runTransaction(RTS.joinRoomTX, nanoid())(roomId, userKey, 0)

				const roomState = AtomIO.findState(RTS.roomSelectors, roomId)
				const room = await AtomIO.getState(roomState)
				const roomSocket = new RTS.ChildSocket(room)
				roomSocket.emit(`setup-relay`, userKey)

				toRoom = (payload) => {
					roomSocket.emit(`relay:${userKey}`, ...payload)
				}

				while (roomQueue.length > 0) {
					const payload = roomQueue.shift()
					if (payload) toRoom(payload)
				}

				roomSocket.onAny((...payload) => socket.emit(...payload))

				room.stderr.on(`data`, (buf) => {
					const err = buf.toString()
					console.error(`❌ ${roomId} [${room.pid}]\n${err}`)
				})

				room.on(`close`, (code) => {
					console.log(`${roomId} exited with code ${code}`)
					socket.emit(`room-close`, roomId, code)
				})
			})

			socket.onAny((...payload: [string, ...Json.Array]) => {
				console.log(`🛰 `, userKey, ...payload)
				toRoom(payload)
			})
			socket.onAnyOutgoing((event, ...args) => {
				console.log(`🛰  >>`, userKey, event, ...args)
			})
		})
	},
)
