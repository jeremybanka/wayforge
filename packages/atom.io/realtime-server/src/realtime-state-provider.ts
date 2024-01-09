import * as AtomIO from "atom.io"
import { IMPLICIT, subscribeToState } from "atom.io/internal"
import type { Json } from "atom.io/json"

import type { ServerConfig } from "."

export function realtimeStateProvider({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function stateProvider<J extends Json.Serializable>(
		token: AtomIO.WritableToken<J>,
	): () => void {
		let unsubscribeFromStateUpdates: (() => void) | null = null

		const fillUnsubRequest = () => {
			socket.off(`unsub:${token.key}`, fillUnsubRequest)
			unsubscribeFromStateUpdates?.()
			unsubscribeFromStateUpdates = null
		}

		const fillSubRequest = () => {
			socket.emit(`serve:${token.key}`, AtomIO.getState(token, store))
			unsubscribeFromStateUpdates = subscribeToState(
				token,
				({ newValue }) => {
					socket.emit(`serve:${token.key}`, newValue)
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
