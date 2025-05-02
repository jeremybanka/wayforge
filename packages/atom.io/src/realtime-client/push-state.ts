import type * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Socket } from "socket.io-client"

export function pushState<J extends Json.Serializable>(
	store: Internal.Store,
	socket: Socket,
	token: AtomIO.WritableToken<J>,
): () => void {
	socket.emit(`claim:${token.key}`)
	Internal.subscribeToState(store, token, `push`, ({ newValue }) => {
		socket.emit(`pub:${token.key}`, newValue)
	})
	return () => {
		socket.off(`pub:${token.key}`)
		socket.emit(`unclaim:${token.key}`)
	}
}
