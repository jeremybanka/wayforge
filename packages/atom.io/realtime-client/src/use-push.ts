import * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Socket } from "socket.io-client"

export function pushState<J extends Json.Serializable>(
	token: AtomIO.StateToken<J>,
	socket: Socket,
	subscriptionKey: string,
	store: Store,
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
