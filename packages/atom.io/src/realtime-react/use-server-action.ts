import type * as AtomIO from "atom.io"
import type { Fn } from "atom.io/internal"
import { actUponStore, arbitrary } from "atom.io/internal"
import { StoreContext } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function useServerAction<F extends Fn>(
	token: AtomIO.TransactionToken<F>,
): (...parameters: Parameters<F>) => ReturnType<F> {
	const store = React.useContext(StoreContext)

	useRealtimeService(`tx:${token.key}`, (socket) =>
		RTC.serverAction(store, socket, token),
	)
	return actUponStore(store, token, arbitrary())
}
