import type * as AtomIO from "atom.io"
import type { Transceiver } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { StoreContext } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function usePullMutableFamilyMember<
	T extends Transceiver<any>,
	J extends Json.Serializable,
>(token: AtomIO.MutableAtomToken<T, J>): void {
	const store = React.useContext(StoreContext)
	useRealtimeService(`pull:${token.key}`, (socket) =>
		RTC.pullMutableFamilyMember(token, socket, store),
	)
}
