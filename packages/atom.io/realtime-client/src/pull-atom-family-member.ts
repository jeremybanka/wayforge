import type * as AtomIO from "atom.io"
import { setIntoStore, type Store } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { parseJson } from "atom.io/json"
import type { Socket } from "socket.io-client"

/* eslint-disable no-console */

export function pullAtomFamilyMember<J extends Json.Serializable>(
	store: Store,
	socket: Socket,
	token: AtomIO.RegularAtomToken<J>,
): () => void {
	if (!(`family` in token)) {
		console.error(`Token is not a family member:`, token)
		return () => {}
	}
	const { key: familyKey, subKey: serializedSubKey } = token.family
	const subKey = parseJson(serializedSubKey)
	socket?.on(`serve:${token.key}`, (data: J) => {
		setIntoStore(store, token, data)
	})
	socket?.emit(`sub:${familyKey}`, subKey)
	return () => {
		socket?.off(`serve:${token.key}`)
		socket?.emit(`unsub:${token.key}`)
	}
}
