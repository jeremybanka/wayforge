import type { WritableToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { subscribeToState } from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Socket } from "socket.io-client"

export function pushState<J extends Json.Serializable>(
	store: Store,
	socket: Socket,
	token: WritableToken<J>,
): () => void {
	socket.emit(`claim:${token.key}`)
	subscribeToState(store, token, `push`, ({ newValue }) => {
		socket.emit(`pub:${token.key}`, newValue)
	})
	return () => {
		socket.off(`pub:${token.key}`)
		socket.emit(`unclaim:${token.key}`)
	}
}
