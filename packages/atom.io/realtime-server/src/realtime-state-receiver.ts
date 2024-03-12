import type { WritableToken } from "atom.io"
import { IMPLICIT, setIntoStore } from "atom.io/internal"
import type { Json } from "atom.io/json"

import type { ServerConfig } from "."

export type StateReceiver = ReturnType<typeof realtimeStateReceiver>
export function realtimeStateReceiver({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function stateReceiver<J extends Json.Serializable>(
		token: WritableToken<J>,
	): () => void {
		const publish = (newValue: J) => { setIntoStore(token, newValue, store); }

		const fillPubUnclaim = () => {
			socket.off(`pub:${token.key}`, publish)
			socket.off(`unclaim:${token.key}`, fillPubUnclaim)
		}
		const fillPubClaim = () => {
			socket.on(`pub:${token.key}`, publish)
			socket.on(`unclaim:${token.key}`, fillPubUnclaim)
		}

		socket.on(`claim:${token.key}`, fillPubClaim)

		return () => {
			socket.off(`claim:${token.key}`, fillPubClaim)
			socket.off(`pub:${token.key}`, publish)
		}
	}
}
