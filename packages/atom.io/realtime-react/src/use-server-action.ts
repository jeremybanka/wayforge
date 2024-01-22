import * as AtomIO from "atom.io"
import { arbitrary } from "atom.io/internal"
import { StoreContext } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function useServerAction<ƒ extends AtomIO.ƒn>(
	token: AtomIO.TransactionToken<ƒ>,
): (...parameters: Parameters<ƒ>) => ReturnType<ƒ> {
	const store = React.useContext(StoreContext)

	useRealtimeService(`tx:${token.key}`, (socket) =>
		RTC.serverAction(token, socket, store),
	)
	return AtomIO.actUponStore(token, arbitrary(), store)
}
