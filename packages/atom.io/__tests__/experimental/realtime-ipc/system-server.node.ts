import path from "node:path"

import type { Silo } from "atom.io"
import { findInStore, getInternalRelationsFromStore } from "atom.io/internal"
import * as RT from "atom.io/realtime"
import * as RTS from "atom.io/realtime-server"
import type * as SocketIO from "socket.io"

function resolveRoomScript(name: string): [string, string[]] {
	return [`bun`, [path.join(__dirname, name)]]
}
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
		RTS.selfListSelectors,
		username,
	)
	exposeMutableFamily(usersInRoomsAtoms, usersWhoseRoomsCanBeSeenSelector)
	const usersOfSocketsAtoms = getInternalRelationsFromStore(
		RTS.usersOfSockets,
		store,
	)
	exposeMutableFamily(usersOfSocketsAtoms, RTS.socketIndex)

	RTS.useRooms({ store, socket }, resolveRoomScript)
}
