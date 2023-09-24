import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { parseJson } from "atom.io/json"
import type { Socket } from "socket.io-client"

export function pullFamilyMember<J extends Json.Serializable>(
	token: AtomIO.AtomToken<J>,
	socket: Socket,
	store: AtomIO.Store,
): () => void {
	if (!(`family` in token)) {
		console.error(`Token is not a family member:`, token)
		return () => {}
	}
	const { key: familyKey, subKey: serializedSubKey } = token.family
	const subKey = parseJson(serializedSubKey)
	socket?.on(`serve:${token.key}`, (data: J) => {
		AtomIO.setState(token, data, store)
	})
	socket?.emit(`sub:${familyKey}`, subKey)
	return () => {
		socket?.off(`serve:${token.key}`)
		socket?.emit(`unsub:${token.key}`)
	}
}
