import type { WritableToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { setIntoStore, subscribeToState } from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Socket } from "atom.io/realtime"
import { employSocket, mutexAtoms } from "atom.io/realtime"

export function pushState<J extends Json.Serializable>(
	store: Store,
	socket: Socket,
	token: WritableToken<J>,
): () => void {
	const publish = (newValue: J) => {
		socket.emit(`pub:${token.key}`, newValue)
	}

	const subscriptions = new Set<() => void>()
	const clearSubscriptions = () => {
		for (const unsub of subscriptions) unsub()
		subscriptions.clear()
	}

	const init = () => {
		subscriptions.add(
			employSocket(socket, `claim-result:${token.key}`, (success: boolean) => {
				if (!success) return

				clearSubscriptions()
				setIntoStore(store, mutexAtoms, token.key, true)
				subscriptions.add(
					subscribeToState(store, token, `push`, ({ newValue }) => {
						publish(newValue)
					}),
				)
			}),
		)

		socket.emit(`claim:${token.key}`)
	}

	init()

	return () => {
		clearSubscriptions()
		socket.emit(`unclaim:${token.key}`)
	}
}
