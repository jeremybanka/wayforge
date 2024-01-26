import path from "path"
import type * as AtomIO from "atom.io"
import {
	actUponStore,
	arbitrary,
	findInStore,
	getFromStore,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import * as RTS from "atom.io/realtime-server"
import type * as SocketIO from "socket.io"

export const SystemServer = ({
	socket,
	silo: { store },
}: { socket: SocketIO.Socket; silo: AtomIO.Silo }): void => {
	const userKeyState = findInStore(
		RTS.usersOfSockets.states.userKeyOfSocket,
		socket.id,
		store,
	)
	const userKey = getFromStore(userKeyState, store)

	const exposeMutable = RTS.realtimeMutableProvider({ socket, store })
	exposeMutable(RTS.roomIndex)

	const exposeMutableFamily = RTS.realtimeMutableFamilyProvider({
		socket,
		store,
	})
	exposeMutableFamily(
		RTS.usersOfSockets.core.findRelatedKeysState,
		RTS.socketIndex,
	)
	exposeMutableFamily(RTS.usersInRooms.core.findRelatedKeysState, RTS.userIndex)
	socket.on(`create-room`, async (roomId) => {
		actUponStore(RTS.createRoomTX, arbitrary(), store)(roomId, `bun`, [
			path.join(__dirname, `game-instance.bun.ts`),
		])
	})

	const roomQueue: [string, ...Json.Array][] = []
	let toRoom = (payload: [string, ...Json.Array]): void => {
		roomQueue.push(payload)
	}

	socket.on(`join-room`, async (roomId) => {
		if (!userKey) throw new Error(`User not found`)

		actUponStore(RTS.joinRoomTX, arbitrary(), store)(roomId, userKey, 0)

		const roomState = findInStore(RTS.roomSelectors, roomId, store)
		const room = await getFromStore(roomState, store)
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
}
