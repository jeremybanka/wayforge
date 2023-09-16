import * as AtomIO from "atom.io"
import type { MutableAtomFamily } from "atom.io"
import { getJsonToken, getUpdateToken } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { StoreContext } from "atom.io/react"
import type { Transceiver } from "atom.io/tracker"
import * as React from "react"

import { RealtimeContext } from "./realtime-context"

export function usePullMutableFamilyMember<
	T extends Transceiver<Json.Serializable>,
	J extends Json.Serializable,
>(
	family: MutableAtomFamily<T, J, Json.Serializable>,
	subKey: AtomIO.Json.Serializable,
): void {
	const token = family(subKey)
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	React.useEffect(() => {
		socket?.on(`init:${token.key}`, (data: J) => {
			const token = family(subKey)
			const jsonToken = getJsonToken(token)
			AtomIO.setState(jsonToken, data, store)
		})
		socket?.on(
			`next:${token.key}`,
			(data: T extends Transceiver<infer Signal> ? Signal : never) => {
				const token = family(subKey)
				const trackerToken = getUpdateToken(token)
				AtomIO.setState(trackerToken, data, store)
			},
		)
		socket?.emit(`sub:${family.key}`, subKey)
		return () => {
			socket?.off(`serve:${token.key}`)
			socket?.emit(`unsub:${token.key}`)
		}
	}, [family.key])
}
