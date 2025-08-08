import type * as AtomIO from "atom.io"
import type { Store, Transceiver } from "atom.io/internal"
import { getJsonToken, getUpdateToken, setIntoStore } from "atom.io/internal"
import type { Socket } from "socket.io-client"

export function pullMutableAtom<T extends Transceiver<any, any>>(
	store: Store,
	socket: Socket,
	token: AtomIO.MutableAtomToken<T>,
): () => void {
	const jsonToken = getJsonToken(store, token)
	const updateToken = getUpdateToken(token)
	socket.on(`init:${token.key}`, (data: ReturnType<T[`toJSON`]>) => {
		setIntoStore(store, jsonToken, data)
	})
	socket.on(
		`next:${token.key}`,
		(data: T extends Transceiver<infer Update, any> ? Update : never) => {
			setIntoStore(store, updateToken, data)
		},
	)
	socket.emit(`sub:${token.key}`)
	return () => {
		socket.off(`init:${token.key}`)
		socket.off(`next:${token.key}`)
		socket.emit(`unsub:${token.key}`)
	}
}
