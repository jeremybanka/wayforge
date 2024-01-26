import { StoreContext } from "atom.io/react"
import * as React from "react"
import { syncContinuity } from "../../realtime-client/src/sync-continuity"
import type { ContinuityToken } from "../../realtime/src/realtime-continuity"
import { useRealtimeService } from "./use-realtime-service"

export function useSyncContinuity(token: ContinuityToken): void {
	const store = React.useContext(StoreContext)
	useRealtimeService(`tx-sync:${token.key}`, (socket) => {
		return syncContinuity(token, socket, store)
	})
}
