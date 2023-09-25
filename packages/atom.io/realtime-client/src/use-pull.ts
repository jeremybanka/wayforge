import * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Socket } from "socket.io-client"

export function pullState<J extends Json.Serializable>(
	token: AtomIO.StateToken<J>,
	socket: Socket,
	store: Store,
): () => void {
	socket.on(`serve:${token.key}`, (data) => {
		AtomIO.setState(token, data, store)
	})
	socket.emit(`sub:${token.key}`)
	return () => {
		socket.off(`serve:${token.key}`)
		socket.emit(`unsub:${token.key}`)
	}
}
