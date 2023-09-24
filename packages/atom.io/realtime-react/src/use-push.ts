import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { StoreContext } from "atom.io/react"
import * as React from "react"
import type { Socket } from "socket.io-client"

import { RealtimeContext } from "./realtime-context"

export function pushState<J extends Json.Serializable>(
	token: AtomIO.StateToken<J>,
	socket: Socket,
	subscriptionKey: string,
	store: AtomIO.Store,
): () => void {
	socket.emit(`claim:${token.key}`)
	AtomIO.subscribe(
		token,
		({ newValue }) => {
			socket.emit(`pub:${token.key}`, newValue)
		},
		subscriptionKey,
		store,
	)
	return () => {
		socket.off(`pub:${token.key}`)
		socket.emit(`unclaim:${token.key}`)
	}
}

export function usePush<J extends Json.Serializable>(
	token: AtomIO.StateToken<J>,
): void {
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	const id = React.useId()
	React.useEffect(
		() => pushState(token, socket, `use-push:${id}`, store),
		[token.key],
	)
}
