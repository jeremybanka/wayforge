import * as AtomIO from "atom.io"
import type { Transceiver } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { StoreContext } from "atom.io/react"
import * as React from "react"

import { getJsonToken, getUpdateToken, withdraw } from "atom.io/internal"
import { RealtimeContext } from "./realtime-context"

export function usePullMutable<
	T extends Transceiver<Json.Serializable>,
	J extends Json.Serializable,
>(token: AtomIO.MutableAtomToken<T, J>): void {
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	const jsonToken = getJsonToken(token)
	const trackerToken = getUpdateToken(token)
	console.log(`💥`, store.config.name, `usePullMutable ran`)
	React.useEffect(() => {
		console.log(`💥💥`, store.config.name, `usePullMutable ran effect`)
		socket.on(`init:${token.key}`, (data: J) => {
			console.log(`💥💥💥`, store.config.name, `init json`)
			AtomIO.setState(jsonToken, data, store)
		})
		socket.on(
			`next:${token.key}`,
			(data: T extends Transceiver<infer Update> ? Update : never) => {
				console.log(`💥💥💥💥`, store.config.name, `next update`)
				console.log(withdraw(trackerToken, store))
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
