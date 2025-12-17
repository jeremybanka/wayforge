import type * as AtomIO from "atom.io"
import type { AsJSON, SignalFrom, Store, Transceiver } from "atom.io/internal"
import {
	findInStore,
	getJsonToken,
	getUpdateToken,
	setIntoStore,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import type { Socket } from "atom.io/realtime"

export function pullMutableAtomFamilyMember<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
>(
	store: Store,
	socket: Socket,
	family: AtomIO.MutableAtomFamilyToken<T, K>,
	key: NoInfer<K>,
): () => void {
	const token = findInStore(store, family, key)
	socket.on(`init:${token.key}`, (data: AsJSON<T>) => {
		const jsonToken = getJsonToken(store, token)
		setIntoStore(store, jsonToken, data)
	})
	socket.on(`next:${token.key}`, (data: SignalFrom<T>) => {
		const trackerToken = getUpdateToken(token)
		setIntoStore(store, trackerToken, data)
	})
	socket.emit(`sub:${family.key}`, key)
	return () => {
		socket.off(`serve:${token.key}`)
		socket.emit(`unsub:${token.key}`)
	}
}
