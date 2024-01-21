import type * as AtomIO from "atom.io"
import { type Store, setIntoStore } from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Socket } from "socket.io-client"

export function pullState<J extends Json.Serializable>(
	token: AtomIO.WritableToken<J>,
	socket: Socket,
	store: Store,
): () => void {
	const setServedValue = (data: J) => {
		setIntoStore(token, data, store)
	}
	socket.on(`serve:${token.key}`, setServedValue)
	socket.emit(`sub:${token.key}`)
	return () => {
		socket.off(`serve:${token.key}`, setServedValue)
		socket.emit(`unsub:${token.key}`)
	}
}
