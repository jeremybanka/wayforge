import path from "node:path"

import type { Silo } from "atom.io"
import {
	actUponStore,
	arbitrary,
	findInStore,
	findRelationsInStore,
	getFromStore,
	getInternalRelationsFromStore,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
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
		const roomQueue: [string, ...Json.Array][] = []
		const pushToRoomQueue = (payload: [string, ...Json.Array]): void => {
			roomQueue.push(payload)
		}
		let toRoom = pushToRoomQueue
		const forward = (...payload: [string, ...Json.Array]) => {
			toRoom(payload)
		}
		socket.onAny(forward)

		RTS.joinRoom(roomId, username, store)

		const roomSocket = RTS.ROOMS.get(roomId)!
		roomSocket.onAny((...payload) => socket.emit(...payload))
		roomSocket.emit(`user-joins`, username)

		toRoom = (payload) => {
			roomSocket.emit(`user::${username}`, ...payload)
		}
		while (roomQueue.length > 0) {
			const payload = roomQueue.shift()
			if (payload) toRoom(payload)
		}

		roomSocket.on(`close`, (code) => {
			console.info(`[${shortId}]:${username}`, `room "${roomId}" closing`)
			socket.emit(`room-close`, roomId, code)
			RTS.destroyRoom(roomId, store)
		})
		const leave = () => {
			console.log(`🥋 LEAVE ROOM RECEIVED`)
			socket.off(`leave-room`, leave)
			socket.offAny(forward)
			// roomSocket.dispose() IMPLEMENT ❗
			toRoom([`user-leaves`])
			// actUponStore(store, RTS.leaveRoomTX, arbitrary())(roomId, username)
			RTS.leaveRoom(roomId, username, store)
		}

		socket.on(`leave-room`, leave)
	})

	const handleDisconnect = () => {
		console.log(`🥋 DISCONNECT RECEIVED`)
		socket.off(`disconnect`, handleDisconnect)
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
		actUponStore(store, RTS.leaveRoomTX, arbitrary())(`*`, username)
		console.info(`[${shortId}]:${username}`, `disconnected`)
	}
	socket.on(`disconnect`, handleDisconnect)
}
