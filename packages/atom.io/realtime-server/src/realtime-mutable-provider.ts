import type * as AtomIO from "atom.io"
import type { Transceiver } from "atom.io/internal"
import {
	getFromStore,
	getJsonTokenFromStore,
	getUpdateToken,
	IMPLICIT,
	subscribeToState,
} from "atom.io/internal"
import type { Json } from "atom.io/json"

import type { ServerConfig } from "."

export type MutableProvider = ReturnType<typeof realtimeMutableProvider>
export function realtimeMutableProvider({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function mutableProvider<
		Core extends Transceiver<Json.Serializable>,
		SerializableCore extends Json.Serializable,
	>(token: AtomIO.MutableAtomToken<Core, SerializableCore>): () => void {
		let unsubscribeFromStateUpdates: (() => void) | null = null

		const jsonToken = getJsonTokenFromStore(token, store)
		const trackerToken = getUpdateToken(token)

		const fillUnsubRequest = () => {
			socket.off(`unsub:${token.key}`, fillUnsubRequest)
			unsubscribeFromStateUpdates?.()
			unsubscribeFromStateUpdates = null
		}

		const fillSubRequest = () => {
			socket.emit(`init:${token.key}`, getFromStore(jsonToken, store))
			unsubscribeFromStateUpdates = subscribeToState(
				trackerToken,
				({ newValue }) => {
					socket.emit(`next:${token.key}`, newValue)
				},
				`expose-single:${socket.id}`,
				store,
			)
			socket.on(`unsub:${token.key}`, fillUnsubRequest)
		}

		socket.on(`sub:${token.key}`, fillSubRequest)

		return () => {
			socket.off(`sub:${token.key}`, fillSubRequest)
			unsubscribeFromStateUpdates?.()
		}
	}
}
