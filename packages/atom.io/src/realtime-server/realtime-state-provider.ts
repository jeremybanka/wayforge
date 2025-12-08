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
	userKey,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	store.logger.info(`🔌`, `user`, userKey, `initialized state provider`)
	return function stateProvider<J extends Json.Serializable>(
		clientToken: AtomIO.WritableToken<J>,
		serverData: AtomIO.ReadableToken<NoInfer<J>> | NoInfer<J> = clientToken,
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
					userKey,
					`will be served`,
					serverData,
					`as "${clientToken.key}"`,
				)
			} else {
				store.logger.info(
					`👀`,
					`user`,
					userKey,
					`can subscribe to state "${serverData.key}" as "${clientToken.key}"`,
				)
			}
			subscriptions.add(
				employSocket(socket, `sub:${clientToken.key}`, () => {
					if (isStatic) {
						store.logger.info(
							`👀`,
							`user`,
							userKey,
							`requests`,
							`"${clientToken.key}"`,
						)
						socket.emit(`serve:${clientToken.key}`, serverData)
					} else {
						store.logger.info(
							`👀`,
							`user`,
							userKey,
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
									userKey,
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
