import type { WritableToken } from "atom.io"
import {
	findInStore,
	getFromStore,
	IMPLICIT,
	setIntoStore,
	subscribeToState,
} from "atom.io/internal"
import {
	operateOnStore,
	OWN_OP,
} from "atom.io/internal/set-state/operate-on-store"
import type { Json } from "atom.io/json"
import { mutexAtoms } from "atom.io/realtime/mutex-store"

import type { ServerConfig } from "."
import { employSocket } from "./employ-socket"

export type StateReceiver = ReturnType<typeof realtimeStateReceiver>
export function realtimeStateReceiver({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function stateReceiver<J extends Json.Serializable>(
		token: WritableToken<J>,
	): () => void {
		const mutexAtom = findInStore(store, mutexAtoms, token.key)

		const subscriptions = new Set<() => void>()
		const clearSubscriptions = () => {
			for (const unsub of subscriptions) unsub()
			subscriptions.clear()
		}

		const permitPublish = () => {
			clearSubscriptions()
			subscriptions.add(
				employSocket(socket, `pub:${token.key}`, (newValue) => {
					setIntoStore(store, token, newValue as J)
				}),
			)
			subscriptions.add(
				employSocket(socket, `unclaim:${token.key}`, () => {
					setIntoStore(store, mutexAtom, false)
					clearSubscriptions()
					start()
				}),
			)
		}

		const start = () => {
			subscriptions.add(
				employSocket(socket, `claim:${token.key}`, () => {
					if (getFromStore(store, mutexAtom)) {
						clearSubscriptions()
						subscriptions.add(
							subscribeToState(store, mutexAtom, socket.id!, () => {
								const currentValue = getFromStore(store, mutexAtom)
								if (currentValue === false) {
									operateOnStore(OWN_OP, store, mutexAtom, true)
									permitPublish()
									socket.emit(`claim-result:${token.key}`, true)
								}
							}),
						)
						socket.emit(`claim-result:${token.key}`, false)
						return
					}
					setIntoStore(store, mutexAtom, true)
					permitPublish()
					socket.emit(`claim-result:${token.key}`, true)
				}),
			)
		}

		start()

		return clearSubscriptions
	}
}
