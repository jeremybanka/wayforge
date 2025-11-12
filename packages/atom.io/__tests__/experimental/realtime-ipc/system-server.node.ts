import path from "node:path"

import type { Silo } from "atom.io"
import {
	findInStore,
	findRelationsInStore,
	getFromStore,
	getInternalRelationsFromStore,
} from "atom.io/internal"
import * as RT from "atom.io/realtime"
import * as RTS from "atom.io/realtime-server"
import type * as SocketIO from "socket.io"

export const SystemServer = ({
	socket,
	silo: { store },
	enableLogging,
}: {
	socket: SocketIO.Socket
	silo: Silo
	enableLogging: () => void
}): void => {
	enableLogging()
	const shortId = socket.id.slice(0, 3)
	const { username } = socket.handshake.auth
	const exposeMutable = RTS.realtimeMutableProvider({ socket, store })
	const exposeMutableFamily = RTS.realtimeMutableFamilyProvider({
		socket,
		store,
	})

	exposeMutable(RT.roomIndex)

	const usersOfSocketsAtoms = getInternalRelationsFromStore(
		RTS.usersOfSockets,
		store,
	)
	const usersInRoomsAtoms = getInternalRelationsFromStore(RT.usersInRooms, store)
	exposeMutableFamily(usersOfSocketsAtoms, RTS.socketIndex)
	exposeMutableFamily(
		usersInRoomsAtoms,
		findInStore(store, RTS.userMutualSituationalAwarenessIndexes, username),
	)

	socket.on(`create-room`, async (roomId) => {
		await RTS.spawnRoom(
			roomId,
			`bun`,
			[path.join(__dirname, `game-instance.bun.ts`)],
			store,
		)
	})

	socket.on(`delete-room`, (roomId) => {
		console.info(`[${shortId}]:${username}`, `deleting room "${roomId}"`)
		RTS.destroyRoom(roomId, store)
	})

	socket.on(`join-room`, (roomId) => {
		console.info(`[${shortId}]:${username}`, `joining room "${roomId}"`)

		const { leave, roomSocket } = RTS.joinRoom(roomId, username, socket, store)

		roomSocket.on(`close`, (code) => {
			console.info(`[${shortId}]:${username}`, `room "${roomId}" closing`)
			socket.emit(`room-close`, roomId, code)
			RTS.destroyRoom(roomId, store)
		})

		socket.once(`leave-room`, leave)
	})

	socket.once(`disconnect`, () => {
		console.log(`🥋 DISCONNECT RECEIVED`)
		const roomKeyState = findRelationsInStore(
			RT.usersInRooms,
			username,
			store,
		).roomKeyOfUser
		const roomKey = getFromStore(store, roomKeyState)
		if (!roomKey) {
			return
		}
		const roomSocket = RTS.ROOMS.get(roomKey)!
		roomSocket?.emit(`leave-room`, username)
		RTS.leaveRoom(`*`, username, store)
		console.info(`[${shortId}]:${username}`, `disconnected`)
	})
}
