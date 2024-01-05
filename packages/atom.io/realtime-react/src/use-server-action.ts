import * as AtomIO from "atom.io"
import { StoreContext, useO } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { getFamily, useFamily } from "../../__tests__/__util__/use-family"
import { RealtimeContext } from "./realtime-context"
import { useRealtimeService } from "./use-realtime-service"

export function useServerAction<ƒ extends AtomIO.ƒn>(
	token: AtomIO.TransactionToken<ƒ>,
): (...parameters: Parameters<ƒ>) => ReturnType<ƒ> {
	const store = React.useContext(StoreContext)
	const context = React.useContext(RealtimeContext)
	const findQueueState = useFamily(RTC.findTransactionUpdateQueueState)
	const updateQueue = useO(findQueueState(token))

	useRealtimeService(`tx:${token.key}`, () => {
		const { socket } = context
		return RTC.synchronizeTransactionResults(token, socket, updateQueue, store)
	})
	return AtomIO.runTransaction(token, store)
}
