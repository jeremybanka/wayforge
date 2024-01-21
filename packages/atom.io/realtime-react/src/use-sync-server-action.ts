import * as AtomIO from "atom.io"
import { StoreContext } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function useSyncAction<ƒ extends AtomIO.ƒn>(
	token: AtomIO.TransactionToken<ƒ>,
): (...parameters: Parameters<ƒ>) => ReturnType<ƒ> {
	const store = React.useContext(StoreContext)
	useRealtimeService(`tx-sync:${token.key}`, (socket) => {
		return RTC.syncAction(token, socket, store)
	})
	return AtomIO.runTransaction(token, undefined, store)
}
