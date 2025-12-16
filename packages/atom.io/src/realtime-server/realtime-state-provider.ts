import type * as AtomIO from "atom.io"
import { getFromStore, IMPLICIT, subscribeToState } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { employSocket } from "atom.io/realtime"

import type { ServerConfig } from "."

function isReadableToken(input: unknown): input is AtomIO.ReadableToken<any> {
	return (
		typeof input === `object` &&
		input !== null &&
		`key` in input &&
		`type` in input
	)
}

export type StateProvider = ReturnType<typeof realtimeStateProvider>
export function realtimeStateProvider({
	socket,
	consumer,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	store.logger.info(`🔌`, `user`, consumer, `initialized state provider`)
	return function stateProvider<C extends Json.Serializable, S extends C>(
		clientToken: AtomIO.WritableToken<C>,
		serverData:
			| AtomIO.ReadableToken<S>
			| S = clientToken as AtomIO.ReadableToken<S>,
	): () => void {
		const isStatic = !isReadableToken(serverData)

		const subscriptions = new Set<() => void>()
		const clearSubscriptions = () => {
			for (const unsub of subscriptions) unsub()
			subscriptions.clear()
		}

		const start = () => {
			if (isStatic) {
				store.logger.info(
					`👀`,
					`user`,
					consumer,
					`will be served`,
					serverData,
					`as "${clientToken.key}"`,
				)
			} else {
				store.logger.info(
					`👀`,
					`user`,
					consumer,
					`can subscribe to state "${serverData.key}" as "${clientToken.key}"`,
				)
			}
			subscriptions.add(
				employSocket(socket, `sub:${clientToken.key}`, () => {
					if (isStatic) {
						store.logger.info(
							`👀`,
							`user`,
							consumer,
							`requests`,
							`"${clientToken.key}"`,
						)
						socket.emit(`serve:${clientToken.key}`, serverData)
					} else {
						store.logger.info(
							`👀`,
							`user`,
							consumer,
							`subscribes to state "${serverData.key}"`,
							clientToken === serverData
								? `directly`
								: `as "${clientToken.key}"`,
						)
						clearSubscriptions()
						socket.emit(
							`serve:${clientToken.key}`,
							getFromStore(store, serverData),
						)
						subscriptions.add(
							subscribeToState(
								store,
								serverData,
								`expose-single:${socket.id}`,
								({ newValue }) => {
									socket.emit(`serve:${clientToken.key}`, newValue)
								},
							),
						)
						subscriptions.add(
							employSocket(socket, `unsub:${serverData.key}`, () => {
								store.logger.info(
									`🙈`,
									`user`,
									consumer,
									`unsubscribes from state "${serverData.key}", served`,
									clientToken === serverData
										? `directly`
										: `as "${clientToken.key}"`,
								)
								clearSubscriptions()
								start()
							}),
						)
					}
				}),
			)
		}

		start()

		return clearSubscriptions
	}
}
