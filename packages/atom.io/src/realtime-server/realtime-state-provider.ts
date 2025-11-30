import type * as AtomIO from "atom.io"
import { getFromStore, IMPLICIT, subscribeToState } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { employSocket } from "atom.io/realtime"

import type { ServerConfig } from "."

export type StateProvider = ReturnType<typeof realtimeStateProvider>
export function realtimeStateProvider({
	socket,
	userKey,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	store.logger.info(`🔌`, `user`, userKey, `initialized state provider`)
	return function stateProvider<J extends Json.Serializable>(
		token: AtomIO.WritableToken<J>,
	): () => void {
		const subscriptions = new Set<() => void>()
		const clearSubscriptions = () => {
			for (const unsub of subscriptions) unsub()
			subscriptions.clear()
		}

		const start = () => {
			store.logger.info(
				`👀`,
				`user`,
				userKey,
				`can subscribe to state "${token.key}"`,
			)
			subscriptions.add(
				employSocket(socket, `sub:${token.key}`, () => {
					store.logger.info(
						`👀`,
						`user`,
						userKey,
						`subscribed to state "${token.key}"`,
					)
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
							store.logger.info(
								`🙈`,
								`user`,
								userKey,
								`unsubscribed from state "${token.key}"`,
							)
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
