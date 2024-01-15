import * as AtomIO from "atom.io"
import { StoreContext, useO } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function useSyncAction<ƒ extends AtomIO.ƒn>(
	token: AtomIO.TransactionToken<ƒ>,
): (...parameters: Parameters<ƒ>) => ReturnType<ƒ> {
	const store = React.useContext(StoreContext)
	const updateQueueState = AtomIO.findState(RTC.updateQueueAtoms, token)
	const updateQueue = useO(updateQueueState)

	useRealtimeService(`tx:${token.key}`, (socket) =>
		RTC.syncAction(token, socket, updateQueue, store),
	)
	return AtomIO.runTransaction(token, undefined, store)
}
