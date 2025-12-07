import path from "node:path"

import type { Silo } from "atom.io"
import type { UserKey } from "atom.io/realtime"
import * as RTS from "atom.io/realtime-server"
import type * as SocketIO from "socket.io"

function resolveRoomScript(name: string): [string, string[]] {
	return [`bun`, [path.join(__dirname, name)]]
}
export const SystemServer = ({
	socket,
	silo: { store },
	enableLogging,
	userKey,
}: {
	socket: SocketIO.Socket
	silo: Silo
	enableLogging: () => void
	userKey: UserKey
}): void => {
	enableLogging()
	RTS.provideIdentity({
		store,
		socket,
		userKey,
	})
	RTS.provideRooms({
		store,
		socket,
		userKey,
		resolveRoomScript,
		roomNames: [`game-instance.bun.ts`],
	})
}
