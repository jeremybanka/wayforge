import type * as AtomIO from "atom.io"
import type { ViewOf } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { StoreContext, useO } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function usePullSelector<J extends Json.Serializable>(
	token: AtomIO.SelectorToken<J>,
): ViewOf<J> {
	const store = React.useContext(StoreContext)
	useRealtimeService(`pull:${token.key}`, (socket) =>
		RTC.pullSelector(store, socket, token),
	)
	return useO(token)
}
