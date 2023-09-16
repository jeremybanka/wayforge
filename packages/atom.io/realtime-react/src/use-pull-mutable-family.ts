import * as AtomIO from "atom.io"
import type { MutableAtomFamily } from "atom.io"
import { getJsonToken, getUpdateToken } from "atom.io/internal"
import type { Transceiver } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { StoreContext } from "atom.io/react"
import * as React from "react"

import { RealtimeContext } from "./realtime-context"

export function usePullMutableFamily<
	T extends Transceiver<Json.Serializable>,
	J extends Json.Serializable,
>(family: MutableAtomFamily<T, J, Json.Serializable>): void {
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)

	React.useEffect(() => {
		socket.on(`init:${family.key}`, (key: Json.Serializable, data: J) => {
			const token = family(key)
			const jsonToken = getJsonToken(token)
			AtomIO.setState(jsonToken, data, store)
		})
		socket.on(
			`next:${family.key}`,
			(
				key: Json.Serializable,
				data: T extends Transceiver<infer Signal> ? Signal : never,
			) => {
				const token = family(key)
				const trackerToken = getUpdateToken(token)
				AtomIO.setState(trackerToken, data, store)
			},
		)
		socket?.emit(`sub:${family.key}`)
		return () => {
			socket?.off(`init:${family.key}`)
			socket?.emit(`unsub:${family.key}`)
		}
	}, [family.key])
}
