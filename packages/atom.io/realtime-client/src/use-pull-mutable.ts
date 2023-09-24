import * as AtomIO from "atom.io"
import type { Transceiver } from "atom.io/internal"
import { getJsonToken, getUpdateToken } from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Socket } from "socket.io-client"

export function pullMutableState<
	T extends Transceiver<Json.Serializable>,
	J extends Json.Serializable,
>(
	token: AtomIO.MutableAtomToken<T, J>,
	socket: Socket,
	store: AtomIO.Store,
): () => void {
	const jsonToken = getJsonToken(token)
	const updateToken = getUpdateToken(token)
	socket.on(`init:${token.key}`, (data: J) => {
		AtomIO.setState(jsonToken, data, store)
	})
	socket.on(
		`next:${token.key}`,
		(data: T extends Transceiver<infer Update> ? Update : never) => {
			AtomIO.setState(updateToken, data, store)
		},
	)
	socket.emit(`sub:${token.key}`)
	return () => {
		socket.off(`init:${token.key}`)
		socket.off(`next:${token.key}`)
		socket.emit(`unsub:${token.key}`)
	}
}
