import type * as AtomIO from "atom.io"
import type { Transceiver } from "atom.io/internal"
import {
	getFromStore,
	getJsonToken,
	getUpdateToken,
	IMPLICIT,
	subscribeToState,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import { employSocket } from "atom.io/realtime"

import type { ServerConfig } from "."

export type MutableProvider = ReturnType<typeof realtimeMutableProvider>
export function realtimeMutableProvider({
	socket,
	consumer,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function mutableProvider<
		Core extends Transceiver<any, Json.Serializable, Json.Serializable>,
	>(token: AtomIO.MutableAtomToken<Core>): () => void {
		const subscriptions = new Set<() => void>()
		const clearSubscriptions = () => {
			for (const unsub of subscriptions) unsub()
			subscriptions.clear()
		}

		const jsonToken = getJsonToken(store, token)
		const trackerToken = getUpdateToken(token)

		const start = () => {
			store.logger.info(
				`👀`,
				`user`,
				consumer,
				`can subscribe to state "${token.key}"`,
			)
			subscriptions.add(
				employSocket(socket, `sub:${token.key}`, () => {
					store.logger.info(
						`👀`,
						`user`,
						consumer,
						`subscribes to state "${token.key}"`,
					)
					clearSubscriptions()
					socket.emit(`init:${token.key}`, getFromStore(store, jsonToken))
					subscriptions.add(
						subscribeToState(
							store,
							trackerToken,
							`expose-single:${socket.id}`,
							({ newValue }) => {
								socket.emit(`next:${token.key}`, newValue)
							},
						),
					)
					subscriptions.add(
						employSocket(socket, `unsub:${token.key}`, () => {
							store.logger.info(
								`🙈`,
								`user`,
								consumer,
								`unsubscribes from state "${token.key}"`,
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
