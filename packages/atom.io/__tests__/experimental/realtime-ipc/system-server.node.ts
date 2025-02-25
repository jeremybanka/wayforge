import path from "node:path"

import type { Silo } from "atom.io"
import {
	actUponStore,
	arbitrary,
	findInStore,
	findRelationsInStore,
	getFromStore,
	getInternalRelationsFromStore,
	setIntoStore,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import * as RT from "atom.io/realtime"
import * as RTS from "atom.io/realtime-server"
import type * as SocketIO from "socket.io"

export const SystemServer = ({
	socket,
	silo: { store },
}: { socket: SocketIO.Socket; silo: Silo }): void => {
	store.loggers[0].logLevel = `warn`
	// socket.onAny((...payload: [string, ...Json.Array]) => {
	// 	logger.info(`🛰 `, username, ...payload)
	// })
	// socket.onAnyOutgoing((event, ...args) => {
	// 	logger.info(`🛰  >>`, username, event, ...args)
	// })
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
	exposeMutable(findInStore(store, usersInRoomsAtoms, username))

	socket.on(`create-room`, async (roomId) => {
		await actUponStore(RTS.createRoomTX, arbitrary(), store)(roomId, `bun`, [
			path.join(__dirname, `game-instance.bun.ts`),
		])
	})

	socket.on(`delete-room`, async (roomId) => {
		const roomState = findInStore(store, RTS.roomSelectors, roomId)
		const roomSocket = await getFromStore(store, roomState)
		console.info(`[${shortId}]:${username}`, `deleting room "${roomId}"`)
		roomSocket.emit(`exit`, username)
		setIntoStore(store, RT.roomIndex, (index) => (index.delete(roomId), index))
	})

	socket.on(`join-room`, async (roomId) => {
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

		actUponStore(RTS.joinRoomTX, arbitrary(), store)(roomId, username, 0)

		const roomSocketState = findInStore(store, RTS.roomSelectors, roomId)
		const roomSocket = await getFromStore(store, roomSocketState)
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
			console.info(`[${shortId}]:${username}`, `room "${roomId}" closing`)
			socket.emit(`room-close`, roomId, code)
			actUponStore(RTS.destroyRoomTX, arbitrary(), store)(roomId)
		})
		const leaveRoom = () => {
			// console.log(`🥋 LEAVE ROOM RECEIVED`)
			socket.off(`leave-room`, leaveRoom)
			socket.offAny(forward)
			// roomSocket.dispose() IMPLEMENT ❗
			toRoom([`user-leaves`])
			actUponStore(RTS.leaveRoomTX, arbitrary(), store)(roomId, username)
		}

		socket.on(`leave-room`, leaveRoom)
	})

	const handleDisconnect = async () => {
		// console.log(`🥋 DISCONNECT RECEIVED`)
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
		const roomSocketState = findInStore(store, RTS.roomSelectors, roomKey)
		const roomSocket = await getFromStore(store, roomSocketState)
		roomSocket?.emit(`leave-room`, username)
		actUponStore(RTS.leaveRoomTX, arbitrary(), store)(`*`, username)
		console.info(`[${shortId}]:${username}`, `disconnected`)
	}
	socket.on(`disconnect`, handleDisconnect)
}
