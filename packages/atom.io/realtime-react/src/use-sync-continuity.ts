import { StoreContext } from "atom.io/react"
import type { ContinuityToken } from "atom.io/realtime"
import { syncContinuity } from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function useSyncContinuity(token: ContinuityToken): void {
	const store = React.useContext(StoreContext)
	useRealtimeService(`tx-sync:${token.key}`, (socket) => {
		return syncContinuity(token, socket, store)
	})
}
