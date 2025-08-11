import type * as AtomIO from "atom.io"
import type { AsJSON, SignalFrom, Store, Transceiver } from "atom.io/internal"
import { getJsonToken, getUpdateToken, setIntoStore } from "atom.io/internal"
import { parseJson } from "atom.io/json"
import type { Socket } from "socket.io-client"

/* eslint-disable no-console */

export function pullMutableAtomFamilyMember<
	T extends Transceiver<any, any, any>,
>(store: Store, socket: Socket, token: AtomIO.MutableAtomToken<T>): () => void {
	if (!(`family` in token)) {
		console.error(`Token is not a family member:`, token)
		return () => {}
	}
	const { key: familyKey, subKey: serializedSubKey } = token.family
	const subKey = parseJson(serializedSubKey)
	socket.on(`init:${token.key}`, (data: AsJSON<T>) => {
		const jsonToken = getJsonToken(store, token)
		setIntoStore(store, jsonToken, data)
	})
	socket.on(`next:${token.key}`, (data: SignalFrom<T>) => {
		const trackerToken = getUpdateToken(token)
		setIntoStore(store, trackerToken, data)
	})
	socket.emit(`sub:${familyKey}`, subKey)
	return () => {
		socket.off(`serve:${token.key}`)
		socket.emit(`unsub:${token.key}`)
	}
}
