import path from "node:path"

import type { Silo } from "atom.io"
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
	RTS.provideRooms({ store, socket, resolveRoomScript })
}
