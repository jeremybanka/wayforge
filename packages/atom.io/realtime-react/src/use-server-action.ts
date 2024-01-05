import * as AtomIO from "atom.io"
import { StoreContext, useI, useO } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { RealtimeContext } from "./realtime-context"

export function useServerAction<ƒ extends AtomIO.ƒn>(
	token: AtomIO.TransactionToken<ƒ>,
): (...parameters: Parameters<ƒ>) => ReturnType<ƒ> {
	const store = React.useContext(StoreContext)
	const { socket } = React.useContext(RealtimeContext)
	const consumerId = React.useId()
	const syncOwnerId = useO(RTC.findSyncOwnerId(token))
	const updateQueue = useO(RTC.findTransactionUpdateQueueState(token))

	React.useEffect(() => {
		if (socket) {
			const context = {
				consumerId,
				syncOwnerId,
				updateQueue,
			}
			return RTC.synchronizeTransactionResults(token, socket, context, store)
		}
	}, [token.key, socket, syncOwnerId])
	return AtomIO.runTransaction(token, store)
}
