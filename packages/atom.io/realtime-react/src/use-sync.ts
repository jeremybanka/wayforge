import type * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { StoreContext, useO } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function useSync<J extends Json.Serializable>(
	token: AtomIO.WritableToken<J>,
): J {
	const store = React.useContext(StoreContext)
	useRealtimeService(`sync:${token.key}`, (socket) =>
		RTC.syncState(token, socket, store),
	)
	return useO(token)
}
