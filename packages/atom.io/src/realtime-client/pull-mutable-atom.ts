import type * as AtomIO from "atom.io"
import type { AsJSON, SignalFrom, Store, Transceiver } from "atom.io/internal"
import { getJsonToken, getUpdateToken, setIntoStore } from "atom.io/internal"
import type { Socket } from "atom.io/realtime"

export function pullMutableAtom<T extends Transceiver<any, any, any>>(
	store: Store,
	socket: Socket,
	token: AtomIO.MutableAtomToken<T>,
): () => void {
	const jsonToken = getJsonToken(store, token)
	const updateToken = getUpdateToken(token)
	socket.on(`init:${token.key}`, (data: AsJSON<T>) => {
		setIntoStore(store, jsonToken, data)
	})
	socket.on(`next:${token.key}`, (data: SignalFrom<T>) => {
		setIntoStore(store, updateToken, data)
	})
	socket.emit(`sub:${token.key}`)
	return () => {
		socket.off(`init:${token.key}`)
		socket.off(`next:${token.key}`)
		socket.emit(`unsub:${token.key}`)
	}
}
