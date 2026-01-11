import type * as AtomIO from "atom.io"
import { StoreContext, useO } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function usePullSelector<T>(
	token: AtomIO.SelectorToken<T>,
): AtomIO.ViewOf<T> {
	const store = React.useContext(StoreContext)
	useRealtimeService(`pull:${token.key}`, (socket) =>
		RTC.pullSelector(store, socket, token),
	)
	return useO(token)
}
