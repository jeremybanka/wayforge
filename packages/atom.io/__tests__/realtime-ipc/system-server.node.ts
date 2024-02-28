import path from "path"
import type { Silo } from "atom.io"
import {
	actUponStore,
	arbitrary,
	findInStore,
	getFromStore,
	setIntoStore,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import * as RT from "atom.io/realtime"
import * as RTS from "atom.io/realtime-server"
import logger from "npmlog"
import type * as SocketIO from "socket.io"

export const SystemServer = ({
	socket,
	silo: { store },
}: { socket: SocketIO.Socket; silo: Silo }): void => {
	store.loggers[0].logLevel = `info`
	socket.onAny((...payload: [string, ...Json.Array]) => {
		logger.info(`🛰 `, username, ...payload)
	})
	socket.onAnyOutgoing((event, ...args) => {
		logger.info(`🛰  >>`, username, event, ...args)
	})
	const shortId = socket.id.slice(0, 3)
	const { username } = socket.handshake.auth
	const exposeMutable = RTS.realtimeMutableProvider({ socket, store })
	const exposeMutableFamily = RTS.realtimeMutableFamilyProvider({
		socket,
		store,
	})

	exposeMutable(RT.roomIndex)

	exposeMutableFamily(
		RTS.usersOfSockets.core.findRelatedKeysState,
		RTS.socketIndex,
	)
	exposeMutable(RT.usersInRooms.core.findRelatedKeysState(username))

	socket.on(`create-room`, async (roomId) => {
		actUponStore(RTS.createRoomTX, arbitrary(), store)(roomId, `bun`, [
			// `--smol`,
			path.join(__dirname, `game-instance.bun.ts`),
		])
	})

	socket.on(`delete-room`, async (roomId) => {
		const roomState = findInStore(RTS.roomSelectors, roomId, store)
		const roomSocket = await getFromStore(roomState, store)
		logger.info(`[${shortId}]:${username}`, `deleting room "${roomId}"`)
		roomSocket.emit(`exit`, username)
		setIntoStore(RT.roomIndex, (index) => (index.delete(roomId), index), store)
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

		actUponStore(RTS.joinRoomTX, arbitrary(), store)(roomId, username, 0)

		const roomSocketState = findInStore(RTS.roomSelectors, roomId, store)
		const roomSocket = await getFromStore(roomSocketState, store)
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
			actUponStore(RTS.destroyRoomTX, arbitrary(), store)(roomId)
		})
		const leaveRoom = () => {
			socket.off(`user-leaves`, leaveRoom)
			socket.offAny(forward)
			// roomSocket.dispose() IMPLEMENT ❗
			toRoom([`user-leaves`])
			actUponStore(RTS.leaveRoomTX, arbitrary(), store)(roomId, username)
		}

		socket.on(`leave-room`, leaveRoom)
		// socket.on(`disconnect`, leaveRoom)
	})

	const handleDisconnect = async () => {
		socket.off(`disconnect`, handleDisconnect)
		const roomKeyState = findInStore(
			RT.usersInRooms.states.roomKeyOfUser,
			username,
			store,
		)
		const roomKey = getFromStore(roomKeyState, store)
		if (!roomKey) {
			return
		}
		const roomSocketState = findInStore(RTS.roomSelectors, roomKey, store)
		const roomSocket = await getFromStore(roomSocketState, store)
		roomSocket?.emit(`leave-room`, username)
		actUponStore(RTS.leaveRoomTX, arbitrary(), store)(`*`, username)
		logger.info(`[${shortId}]:${username}`, `disconnected`)
	}
	socket.on(`disconnect`, handleDisconnect)
}
