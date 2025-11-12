import path from "node:path"

import type { Silo } from "atom.io"
import { findInStore, getInternalRelationsFromStore } from "atom.io/internal"
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

	const usersInRoomsAtoms = getInternalRelationsFromStore(RT.usersInRooms, store)
	const usersWhoseRoomsCanBeSeenSelector = findInStore(
		store,
		RTS.userMutualSituationalAwarenessIndexes,
		username,
	)
	exposeMutableFamily(usersInRoomsAtoms, usersWhoseRoomsCanBeSeenSelector)
	const usersOfSocketsAtoms = getInternalRelationsFromStore(
		RTS.usersOfSockets,
		store,
	)
	exposeMutableFamily(usersOfSocketsAtoms, RTS.socketIndex)

	socket.on(`create-room`, async (roomId) => {
		console.info(`[${shortId}]:${username}`, `creating room "${roomId}"`)
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

		const { leave } = RTS.joinRoom(roomId, username, socket, store)

		socket.once(`leave-room`, leave)
	})
}
