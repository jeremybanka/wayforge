import type * as AtomIO from "atom.io"
import { IMPLICIT, getFromStore } from "atom.io/internal"
import type { Json } from "atom.io/json"

import type { ServerConfig } from "."

export function realtimeStateSynchronizer({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function stateSynchronizer<J extends Json.Serializable>(
		token: AtomIO.WritableToken<J>,
	): () => void {
		const fillGetRequest = () => {
			socket.emit(`value:${token.key}`, getFromStore(token, store))
		}

		socket.on(`get:${token.key}`, fillGetRequest)
		return () => {
			socket.off(`get:${token.key}`, fillGetRequest)
		}
	}
}
