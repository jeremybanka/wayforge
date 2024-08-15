import type * as AtomIO from "atom.io"
import { setIntoStore, type Store } from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Socket } from "socket.io-client"

export function pullAtom<J extends Json.Serializable>(
	token: AtomIO.RegularAtomToken<J>,
	socket: Socket,
	store: Store,
): () => void {
	const setServedValue = (data: J) => {
		setIntoStore(store, token, data)
	}
	socket.on(`serve:${token.key}`, setServedValue)
	socket.emit(`sub:${token.key}`)
	return () => {
		socket.off(`serve:${token.key}`, setServedValue)
		socket.emit(`unsub:${token.key}`)
	}
}
