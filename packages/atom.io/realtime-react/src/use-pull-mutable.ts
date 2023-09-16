import * as AtomIO from "atom.io"
import type { Transceiver } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { StoreContext } from "atom.io/react"
import * as React from "react"

import { getJsonToken, getUpdateToken } from "atom.io/internal"
import { RealtimeContext } from "./realtime-context"

export function usePullMutable<
	T extends Transceiver<Json.Serializable>,
	J extends Json.Serializable,
>(token: AtomIO.MutableAtomToken<T, J>): void {
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	const jsonToken = getJsonToken(token)
	const trackerToken = getUpdateToken(token)
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
