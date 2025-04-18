import type * as AtomIO from "atom.io"
import { getFromStore, IMPLICIT, subscribeToState } from "atom.io/internal"
import type { Json } from "atom.io/json"

import type { ServerConfig } from "."

export type StateProvider = ReturnType<typeof realtimeStateProvider>
export function realtimeStateProvider({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function stateProvider<J extends Json.Serializable>(
		token: AtomIO.WritableToken<J>,
	): () => void {
		let unsubscribeFromStateUpdates: (() => void) | undefined

		const fillSubRequest = () => {
			socket.emit(`serve:${token.key}`, getFromStore(store, token))

			unsubscribeFromStateUpdates = subscribeToState(
				store,
				token,
				`expose-single:${socket.id}`,
				({ newValue }) => {
					socket.emit(`serve:${token.key}`, newValue)
				},
			)

			const fillUnsubRequest = () => {
				socket.off(`unsub:${token.key}`, fillUnsubRequest)
				if (unsubscribeFromStateUpdates) {
					unsubscribeFromStateUpdates()
					unsubscribeFromStateUpdates = undefined
				}
			}

			socket.on(`unsub:${token.key}`, fillUnsubRequest)
		}

		socket.on(`sub:${token.key}`, fillSubRequest)

		return () => {
			socket.off(`sub:${token.key}`, fillSubRequest)
			if (unsubscribeFromStateUpdates) {
				unsubscribeFromStateUpdates()
				unsubscribeFromStateUpdates = undefined
			}
		}
	}
}
