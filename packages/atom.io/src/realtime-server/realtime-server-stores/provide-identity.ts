import { findRelationsInStore, getFromStore, IMPLICIT } from "atom.io/internal"
import type { SocketKey } from "atom.io/realtime"
import { myUserKeyAtom } from "atom.io/realtime-client"

import { realtimeStateProvider } from "../realtime-state-provider"
import type { ServerConfig } from "../server-config"
import { usersOfSockets } from "./server-user-store"

export function provideIdentity({
	store = IMPLICIT.STORE,
	socket,
}: ServerConfig): void {
	const socketKey = `socket::${socket.id}` satisfies SocketKey
	const userKey = getFromStore(
		store,
		findRelationsInStore(store, usersOfSockets, socketKey).userKeyOfSocket,
	)!

	const provideState = realtimeStateProvider({ socket, store, userKey })

	const unsub = provideState(myUserKeyAtom, userKey)

	socket.on(`disconnect`, () => {
		unsub()
	})
}
