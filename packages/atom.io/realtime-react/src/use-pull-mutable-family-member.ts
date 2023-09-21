import * as AtomIO from "atom.io"
import { getJsonToken, getUpdateToken } from "atom.io/internal"
import type { Transceiver } from "atom.io/internal"
import { parseJson } from "atom.io/json"
import type { Json } from "atom.io/json"
import { StoreContext } from "atom.io/react"
import * as React from "react"

import { RealtimeContext } from "./realtime-context"

export function usePullMutableFamilyMember<
	T extends Transceiver<Json.Serializable>,
	J extends Json.Serializable,
>(token: AtomIO.MutableAtomToken<T, J>): void {
	if (!(`family` in token)) {
		console.error(`Token is not a family member:`, token)
		return
	}
	const { key: familyKey, subKey: serializedSubkey } = token.family
	const subKey = parseJson(serializedSubkey)
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	React.useEffect(() => {
		socket?.on(`init:${token.key}`, (data: J) => {
			const jsonToken = getJsonToken(token)
			AtomIO.setState(jsonToken, data, store)
		})
		socket?.on(
			`next:${token.key}`,
			(data: T extends Transceiver<infer Signal> ? Signal : never) => {
				const trackerToken = getUpdateToken(token)
				AtomIO.setState(trackerToken, data, store)
			},
		)
		socket?.emit(`sub:${familyKey}`, subKey)
		return () => {
			socket?.off(`serve:${token.key}`)
			socket?.emit(`unsub:${token.key}`)
		}
	}, [familyKey])
}
