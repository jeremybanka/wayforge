import type * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Socket } from "socket.io-client"

export function pushState<J extends Json.Serializable>(
	token: AtomIO.WritableToken<J>,
	socket: Socket,
	subscriptionKey: string,
	store: Internal.Store,
): () => void {
	socket.emit(`claim:${token.key}`)
	Internal.subscribeToState(
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
