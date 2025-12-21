import type * as AtomIO from "atom.io"
import type { AsJSON, SignalFrom, Store, Transceiver } from "atom.io/internal"
import { getJsonToken, getUpdateToken, setIntoStore } from "atom.io/internal"
import { employSocket, type Socket } from "atom.io/realtime"

import { createSubscriber } from "./create-subscriber"

export function pullMutableAtom<T extends Transceiver<any, any, any>>(
	store: Store,
	socket: Socket,
	token: AtomIO.MutableAtomToken<T>,
): () => void {
	const jsonToken = getJsonToken(store, token)
	const updateToken = getUpdateToken(token)
	return createSubscriber(socket, token.key, () => {
		const stopWatchingForInit = employSocket(
			socket,
			`init:${token.key}`,
			(data: AsJSON<T>) => {
				setIntoStore(store, jsonToken, data)
			},
		)
		const stopWatchingForUpdate = employSocket(
			socket,
			`next:${token.key}`,
			(data: SignalFrom<T>) => {
				setIntoStore(store, updateToken, data)
			},
		)
		socket.emit(`sub:${token.key}`)
		return () => {
			socket.emit(`unsub:${token.key}`)
			stopWatchingForInit()
			stopWatchingForUpdate()
		}
	})
}
