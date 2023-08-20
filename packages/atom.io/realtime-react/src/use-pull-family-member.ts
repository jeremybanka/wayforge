import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { StoreContext } from "atom.io/react"
import * as React from "react"

import { RealtimeContext } from "./realtime-context"

export function usePullFamilyMember<J extends Json.Serializable>(
	family: AtomIO.AtomFamily<J> | AtomIO.SelectorFamily<J>,
	subKey: AtomIO.Json.Serializable,
): void {
	const token = family(subKey)
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	React.useEffect(() => {
		socket?.on(`serve:${token.key}`, (data: J) => {
			AtomIO.setState(family(subKey), data, store)
		})
		socket?.emit(`sub:${family.key}`, subKey)
		return () => {
			socket?.off(`serve:${token.key}`)
			socket?.emit(`unsub:${token.key}`)
		}
	}, [family.key])
}
