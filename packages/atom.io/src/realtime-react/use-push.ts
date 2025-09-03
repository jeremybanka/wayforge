import type * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { StoreContext, useI, useO } from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function usePush<J extends Json.Serializable>(
	token: AtomIO.WritableToken<J>,
): (<New extends J>(next: New | ((old: J) => New)) => void) | null {
	const store = React.useContext(StoreContext)
	useRealtimeService(`push:${token.key}`, (socket) =>
		RTC.pushState(store, socket, token),
	)
	const mutex = useO(RT.mutexAtoms, token.key)
	const setter = useI(token)

	return mutex ? setter : null
}
