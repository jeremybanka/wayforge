import type * as AtomIO from "atom.io"
import { setIntoStore, type Store } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { employSocket, type Socket } from "atom.io/realtime"

import { createSubscriber } from "./create-subscriber"

export function pullAtom<J extends Json.Serializable>(
	store: Store,
	socket: Socket,
	token: AtomIO.RegularAtomToken<J, any, any>,
): () => void {
	return createSubscriber(socket, token.key, (key) => {
		const stopWatching = employSocket(socket, `serve:${key}`, (data: J) => {
			setIntoStore(store, token, data)
		})
		socket.emit(`sub:${token.key}`)
		return () => {
			socket.emit(`unsub:${key}`)
			stopWatching()
		}
	})
}
