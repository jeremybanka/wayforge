import * as AtomIO from "atom.io"
import * as React from "react"


import type { Json } from "~/packages/anvl/src/json"

import { RealtimeContext } from "./realtime-context"
import { StoreContext } from "../react"

export function usePull<J extends Json>(token: AtomIO.StateToken<J>): void {
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
