import type * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { StoreContext, useI } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function usePush<J extends Json.Serializable>(
	token: AtomIO.WritableToken<J>,
): <New extends J>(next: New | ((old: J) => New)) => void {
	const store = React.useContext(StoreContext)
	useRealtimeService(`push:${token.key}`, (socket) =>
		RTC.pushState(token, socket, store),
	)
	return useI(token)
}
