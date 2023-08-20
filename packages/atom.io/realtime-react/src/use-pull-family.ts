import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { StoreContext } from "atom.io/react"
import * as React from "react"

import { RealtimeContext } from "./realtime-context"

export function usePullFamily<J extends Json.Serializable>(
	family: AtomIO.AtomFamily<J> | AtomIO.SelectorFamily<J>,
): void {
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	React.useEffect(() => {
		socket.on(`serve:${family.key}`, (key: Json.Serializable, data: J) => {
			AtomIO.setState(family(key), data, store)
		})
		socket?.emit(`sub:${family.key}`)
		return () => {
			socket?.off(`serve:${family.key}`)
			socket?.emit(`unsub:${family.key}`)
		}
	}, [family.key])
}
