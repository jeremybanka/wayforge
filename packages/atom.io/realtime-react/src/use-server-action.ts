import * as AtomIO from "atom.io"
import { StoreContext } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { RealtimeContext } from "./realtime-context"

export function useServerAction<ƒ extends AtomIO.ƒn>(
	token: AtomIO.TransactionToken<ƒ>,
): (...parameters: Parameters<ƒ>) => ReturnType<ƒ> {
	const store = React.useContext(StoreContext)
	const { socket } = React.useContext(RealtimeContext)
	React.useEffect(() => {
		if (socket) {
			return RTC.synchronizeTransactionResults(token, socket, store)
		}
	}, [token.key, socket])
	return AtomIO.runTransaction(token, store)
}
