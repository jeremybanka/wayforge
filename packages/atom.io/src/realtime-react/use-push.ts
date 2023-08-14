import * as AtomIO from "atom.io"
import * as React from "react"

import type { Json } from "~/packages/anvl/src/json"

import { RealtimeContext } from "./realtime-context"
import { StoreContext } from "../react"

export function usePush<J extends Json.Serializable>(
	token: AtomIO.StateToken<J>,
): void {
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	React.useEffect(() => {
		socket.emit(`claim:${token.key}`)
		AtomIO.subscribe(
			token,
			({ newValue }) => {
				socket.emit(`pub:${token.key}`, newValue)
			},
			store,
		)
		return () => {
			socket.emit(`unclaim:${token.key}`)
		}
	}, [token.key])
}
