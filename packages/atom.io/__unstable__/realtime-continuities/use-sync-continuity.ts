import { StoreContext } from "atom.io/react"
import * as React from "react"
import { useRealtimeService } from "../../realtime-react/src/use-realtime-service"
import type { ContinuityToken } from "./realtime-continuity"
import { syncContinuity } from "./sync-continuity"

export function useSyncContinuity(token: ContinuityToken): void {
	const store = React.useContext(StoreContext)
	useRealtimeService(`tx-sync:${token.key}`, (socket) => {
		return syncContinuity(token, socket, store)
	})
}
