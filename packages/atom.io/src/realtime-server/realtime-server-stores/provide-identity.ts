import { IMPLICIT } from "atom.io/internal"

import { realtimeStateProvider } from "../realtime-state-provider"
import type { ServerConfig } from "../server-config"

export function provideIdentity({
	store = IMPLICIT.STORE,
	socket,
	userKey,
}: ServerConfig): void {
	const provideState = realtimeStateProvider({ socket, store, userKey })

	const unsub = provideState({ key: `myUserKey`, type: `atom` }, userKey)

	socket.on(`disconnect`, () => {
		unsub()
	})
}
