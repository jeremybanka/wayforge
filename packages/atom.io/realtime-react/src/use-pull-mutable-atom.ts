import type * as AtomIO from "atom.io"
import type { Transceiver } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { StoreContext, useO } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function usePullMutable<
	T extends Transceiver<any>,
	J extends Json.Serializable,
>(token: AtomIO.MutableAtomToken<T, J>): T {
	const store = React.useContext(StoreContext)
	useRealtimeService(`pull:${token.key}`, (socket) =>
		RTC.pullMutableAtom(token, socket, store),
	)
	return useO(token)
}
