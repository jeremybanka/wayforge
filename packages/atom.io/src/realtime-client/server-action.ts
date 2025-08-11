import type * as AtomIO from "atom.io"
import type { Fn, Store } from "atom.io/internal"
import { subscribeToTransaction } from "atom.io/internal"
import type { Socket } from "socket.io-client"

export function serverAction<F extends Fn>(
	store: Store,
	socket: Socket,
	token: AtomIO.TransactionToken<F>,
): () => void {
	const unsubscribeFromLocalUpdates = subscribeToTransaction(
		store,
		token,
		`tx-run:${token.key}:${socket.id}`,
		(clientUpdate) => {
			socket.emit(`tx-run:${token.key}`, clientUpdate)
		},
	)

	return () => {
		unsubscribeFromLocalUpdates()
	}
}
