import { IMPLICIT } from "atom.io/internal"
import { myUserKeyAtom } from "atom.io/realtime-client"

import { realtimeStateProvider } from "../realtime-state-provider"
import type { ServerConfig } from "../server-config"

export function provideIdentity({
	store = IMPLICIT.STORE,
	socket,
	userKey,
}: ServerConfig): void {
	const provideState = realtimeStateProvider({ socket, store, userKey })

	const unsub = provideState(myUserKeyAtom, userKey)

	socket.on(`disconnect`, () => {
		unsub()
	})
}
