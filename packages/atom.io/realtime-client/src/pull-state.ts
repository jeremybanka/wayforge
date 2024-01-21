import * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Socket } from "socket.io-client"

export function pullState<J extends Json.Serializable>(
	token: AtomIO.WritableToken<J>,
	socket: Socket,
	store: Store,
): () => void {
	const setServedValue = (data: J) => {
		AtomIO.setState(token, data, store)
	}
	socket.on(`serve:${token.key}`, setServedValue)
	socket.emit(`sub:${token.key}`)
	return () => {
		socket.off(`serve:${token.key}`, setServedValue)
		socket.emit(`unsub:${token.key}`)
	}
}
