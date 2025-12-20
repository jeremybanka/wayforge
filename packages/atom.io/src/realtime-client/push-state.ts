import type { WritableToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { setIntoStore, subscribeToState } from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Socket } from "atom.io/realtime"
import { employSocket, mutexAtoms } from "atom.io/realtime"

import { createSubscriber } from "./create-subscriber"

export function pushState<J extends Json.Serializable>(
	store: Store,
	socket: Socket,
	token: WritableToken<J>,
): () => void {
	return createSubscriber(socket, `push:${token.key}`, () => {
		let stopWatching = employSocket(
			socket,
			`claim-result:${token.key}`,
			(success: boolean) => {
				if (!success) return
				stopWatching()
				setIntoStore(store, mutexAtoms, token.key, true)
				stopWatching = subscribeToState(store, token, `push`, ({ newValue }) => {
					socket.emit(`pub:${token.key}`, newValue)
				})
			},
		)

		socket.emit(`claim:${token.key}`)

		return () => {
			socket.emit(`unclaim:${token.key}`)
			stopWatching()
		}
	})
}
