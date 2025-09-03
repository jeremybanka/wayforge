import type { WritableToken } from "atom.io"
import { IMPLICIT, setIntoStore } from "atom.io/internal"
import type { Json } from "atom.io/json"

import type { ServerConfig } from "."
import { employSocket } from "./employ-socket"

export type StateReceiver = ReturnType<typeof realtimeStateReceiver>
export function realtimeStateReceiver({
	socket,
	store = IMPLICIT.STORE,
	mutex = new Set<string>(),
}: ServerConfig) {
	return function stateReceiver<J extends Json.Serializable>(
		token: WritableToken<J>,
	): () => void {
		const publish = (newValue: J) => {
			setIntoStore(store, token, newValue)
		}

		const subscriptions = new Set<() => void>()
		const clearSubscriptions = () => {
			for (const unsub of subscriptions) unsub()
			subscriptions.clear()
		}

		const start = () => {
			const retire = employSocket(socket, `claim:${token.key}`, () => {
				console.log(socket.id, { mutex })
				if (mutex.has(token.key)) {
					socket.emit(`claim-result:${token.key}`, false)
					return
				}
				mutex.add(token.key)

				clearSubscriptions()
				subscriptions.add(
					employSocket(socket, `pub:${token.key}`, (newValue) => {
						publish(newValue as J)
					}),
				)
				subscriptions.add(
					employSocket(socket, `unclaim:${token.key}`, () => {
						console.log(socket.id, `unclaiming ${token.key}`)
						mutex.delete(token.key)
						clearSubscriptions()
						start()
					}),
				)
				socket.emit(`claim-result:${token.key}`, true)
			})
			subscriptions.add(retire)
		}

		start()

		return clearSubscriptions
	}
}
