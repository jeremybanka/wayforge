import type { WritableToken } from "atom.io"
import {
	findInStore,
	getFromStore,
	IMPLICIT,
	operateOnStore,
	OWN_OP,
	setIntoStore,
	subscribeToState,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import { mutexAtoms } from "atom.io/realtime"

import type { ServerConfig } from "."
import { employSocket } from "./employ-socket"

export type StateReceiver = ReturnType<typeof realtimeStateReceiver>
export function realtimeStateReceiver({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function stateReceiver<S extends Json.Serializable, C extends S>(
		clientToken: WritableToken<C>,
		serverToken: WritableToken<S> = clientToken,
	): () => void {
		const mutexAtom = findInStore(store, mutexAtoms, serverToken.key)

		const subscriptions = new Set<() => void>()
		const clearSubscriptions = () => {
			for (const unsub of subscriptions) unsub()
			subscriptions.clear()
		}

		const permitPublish = () => {
			clearSubscriptions()
			subscriptions.add(
				employSocket(socket, `pub:${clientToken.key}`, (newValue) => {
					setIntoStore(store, serverToken, newValue as C)
				}),
			)
			subscriptions.add(
				employSocket(socket, `unclaim:${clientToken.key}`, () => {
					setIntoStore(store, mutexAtom, false)
					clearSubscriptions()
					start()
				}),
			)
		}

		const start = () => {
			subscriptions.add(
				employSocket(socket, `claim:${clientToken.key}`, () => {
					if (getFromStore(store, mutexAtom)) {
						clearSubscriptions()
						subscriptions.add(
							subscribeToState(store, mutexAtom, socket.id!, () => {
								const currentValue = getFromStore(store, mutexAtom)
								if (currentValue === false) {
									operateOnStore(OWN_OP, store, mutexAtom, true)
									permitPublish()
									socket.emit(`claim-result:${clientToken.key}`, true)
								}
							}),
						)
						socket.emit(`claim-result:${clientToken.key}`, false)
						return
					}
					setIntoStore(store, mutexAtom, true)
					permitPublish()
					socket.emit(`claim-result:${clientToken.key}`, true)
				}),
			)
		}

		start()

		return clearSubscriptions
	}
}
