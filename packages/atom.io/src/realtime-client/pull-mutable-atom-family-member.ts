import type * as AtomIO from "atom.io"
import type { Store, Transceiver } from "atom.io/internal"
import { getJsonToken, getUpdateToken, setIntoStore } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { parseJson } from "atom.io/json"
import type { Socket } from "socket.io-client"

/* eslint-disable no-console */

export function pullMutableAtomFamilyMember<
	T extends Transceiver<any>,
	J extends Json.Serializable,
>(
	store: Store,
	socket: Socket,
	token: AtomIO.MutableAtomToken<T, J>,
): () => void {
	if (!(`family` in token)) {
		console.error(`Token is not a family member:`, token)
		return () => {}
	}
	const { key: familyKey, subKey: serializedSubKey } = token.family
	const subKey = parseJson(serializedSubKey)
	socket.on(`init:${token.key}`, (data: J) => {
		const jsonToken = getJsonToken(store, token)
		setIntoStore(store, jsonToken, data)
	})
	socket.on(
		`next:${token.key}`,
		(data: T extends Transceiver<infer Signal> ? Signal : never) => {
			const trackerToken = getUpdateToken(token)
			setIntoStore(store, trackerToken, data)
		},
	)
	socket.emit(`sub:${familyKey}`, subKey)
	return () => {
		socket.off(`serve:${token.key}`)
		socket.emit(`unsub:${token.key}`)
	}
}
