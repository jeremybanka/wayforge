import type * as AtomIO from "atom.io"
import type { Store, Transceiver } from "atom.io/internal"
import {
	getJsonTokenFromStore,
	getUpdateToken,
	setIntoStore,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import { parseJson } from "atom.io/json"
import type { Socket } from "socket.io-client"

export function pullMutableAtomFamilyMember<
	T extends Transceiver<any>,
	J extends Json.Serializable,
>(
	token: AtomIO.MutableAtomToken<T, J>,
	socket: Socket,
	store: Store,
): () => void {
	if (!(`family` in token)) {
		console.error(`Token is not a family member:`, token)
		return () => {}
	}
	const { key: familyKey, subKey: serializedSubKey } = token.family
	const subKey = parseJson(serializedSubKey)
	socket.on(`init:${token.key}`, (data: J) => {
		const jsonToken = getJsonTokenFromStore(token, store)
		setIntoStore(jsonToken, data, store)
	})
	socket.on(
		`next:${token.key}`,
		(data: T extends Transceiver<infer Signal> ? Signal : never) => {
			const trackerToken = getUpdateToken(token)
			setIntoStore(trackerToken, data, store)
		},
	)
	socket.emit(`sub:${familyKey}`, subKey)
	return () => {
		socket.off(`serve:${token.key}`)
		socket.emit(`unsub:${token.key}`)
	}
}
