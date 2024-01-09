import * as AtomIO from "atom.io"
import {
	IMPLICIT,
	getJsonToken,
	getUpdateToken,
	subscribeToState,
} from "atom.io/internal"
import type { Transceiver } from "atom.io/internal"
import type { Json } from "atom.io/json"

import type { ServerConfig } from "."

export function realtimeMutableProvider({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function mutableProvider<
		Core extends Transceiver<Json.Serializable>,
		SerializableCore extends Json.Serializable,
	>(token: AtomIO.MutableAtomToken<Core, SerializableCore>): () => void {
		let unsubscribeFromStateUpdates: (() => void) | null = null

		const jsonToken = getJsonToken(token)
		const trackerToken = getUpdateToken(token)

		const fillUnsubRequest = () => {
			socket.off(`unsub:${token.key}`, fillUnsubRequest)
			unsubscribeFromStateUpdates?.()
			unsubscribeFromStateUpdates = null
		}

		const fillSubRequest = () => {
			socket.emit(`init:${token.key}`, AtomIO.getState(jsonToken, store))
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
