import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { StoreContext } from "atom.io/react"
import * as React from "react"

import { RealtimeContext } from "./realtime-context"

export function usePull<J extends Json.Serializable>(
	token: AtomIO.StateToken<J>,
): void {
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	React.useEffect(() => {
		socket.on(`serve:${token.key}`, (data: J) => {
			AtomIO.setState(token, data, store)
		})
		socket.emit(`sub:${token.key}`)
		return () => {
			socket.off(`serve:${token.key}`)
			socket.emit(`unsub:${token.key}`)
		}
	}, [token.key])
}
