import type * as AtomIO from "atom.io"
import type { Store, Transceiver } from "atom.io/internal"
import { getJsonToken, getUpdateToken, setIntoStore } from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Socket } from "socket.io-client"

export function pullMutableState<
	T extends Transceiver<any>,
	J extends Json.Serializable,
>(
	token: AtomIO.MutableAtomToken<T, J>,
	socket: Socket,
	store: Store,
): () => void {
	const jsonToken = getJsonToken(token)
	const updateToken = getUpdateToken(token)
	socket.on(`init:${token.key}`, (data: J) => {
		setIntoStore(jsonToken, data, store)
	})
	socket.on(
		`next:${token.key}`,
		(data: T extends Transceiver<infer Update> ? Update : never) => {
			setIntoStore(updateToken, data, store)
		},
	)
	socket.emit(`sub:${token.key}`)
	return () => {
		socket.off(`init:${token.key}`)
		socket.off(`next:${token.key}`)
		socket.emit(`unsub:${token.key}`)
	}
}
