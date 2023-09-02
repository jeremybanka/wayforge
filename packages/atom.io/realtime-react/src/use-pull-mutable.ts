import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import type { MutableAtomToken } from "atom.io/mutable"
import { getJsonToken, getTrackerToken } from "atom.io/mutable"
import { StoreContext } from "atom.io/react"
import type { Transceiver } from "atom.io/tracker"
import * as React from "react"

import { RealtimeContext } from "./realtime-context"

export function usePullMutable<
	T extends Transceiver<Json.Serializable>,
	J extends Json.Serializable,
>(token: MutableAtomToken<T, J>): void {
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	const jsonToken = getJsonToken(token)
	const trackerToken = getTrackerToken(token)
	React.useEffect(() => {
		socket.on(`init:${token.key}`, (data: J) => {
			AtomIO.setState(jsonToken, data, store)
		})
		socket.on(
			`next:${token.key}`,
			(data: T extends Transceiver<infer Update> ? Update : never) => {
				AtomIO.setState(trackerToken, data, store)
			},
		)
		socket.emit(`sub:${token.key}`)
		return () => {
			socket.off(`init:${token.key}`)
			socket.off(`next:${token.key}`)
			socket.emit(`unsub:${token.key}`)
		}
	}, [token.key])
}
