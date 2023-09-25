import type * as AtomIO from "atom.io"
import type { Transceiver } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { StoreContext } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { RealtimeContext } from "./realtime-context"

export function usePullMutable<
	T extends Transceiver<Json.Serializable>,
	J extends Json.Serializable,
>(token: AtomIO.MutableAtomToken<T, J>): void {
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	React.useEffect(() => RTC.pullMutableState(token, socket, store), [token.key])
}
