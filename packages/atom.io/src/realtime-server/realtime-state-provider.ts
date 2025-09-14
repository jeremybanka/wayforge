import type * as AtomIO from "atom.io"
import { getFromStore, IMPLICIT, subscribeToState } from "atom.io/internal"
import type { Json } from "atom.io/json"

import type { ServerConfig } from "."
import { employSocket } from "atom.io/realtime"

export type StateProvider = ReturnType<typeof realtimeStateProvider>
export function realtimeStateProvider({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function stateProvider<J extends Json.Serializable>(
		token: AtomIO.WritableToken<J>,
	): () => void {
		const subscriptions = new Set<() => void>()
		const clearSubscriptions = () => {
			for (const unsub of subscriptions) unsub()
			subscriptions.clear()
		}

		const start = () => {
			subscriptions.add(
				employSocket(socket, `sub:${token.key}`, () => {
					clearSubscriptions()
					socket.emit(`serve:${token.key}`, getFromStore(store, token))
					subscriptions.add(
						subscribeToState(
							store,
							token,
							`expose-single:${socket.id}`,
							({ newValue }) => {
								socket.emit(`serve:${token.key}`, newValue)
							},
						),
					)
					subscriptions.add(
						employSocket(socket, `unsub:${token.key}`, () => {
							clearSubscriptions()
							start()
						}),
					)
				}),
			)
		}

		start()

		return clearSubscriptions
	}
}
