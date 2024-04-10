import type * as AtomIO from "atom.io"
import { actUponStore, arbitrary } from "atom.io/internal"
import { StoreContext } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function useServerAction<F extends AtomIO.Func>(
	token: AtomIO.TransactionToken<F>,
): (...parameters: Parameters<F>) => ReturnType<F> {
	const store = React.useContext(StoreContext)

	useRealtimeService(`tx:${token.key}`, (socket) =>
		RTC.serverAction(token, socket, store),
	)
	return actUponStore(token, arbitrary(), store)
}
