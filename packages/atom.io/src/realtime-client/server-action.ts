import type * as AtomIO from "atom.io"
import type { Func, Store } from "atom.io/internal"
import { subscribeToTransaction } from "atom.io/internal"
import type { Socket } from "socket.io-client"

export function serverAction<F extends Func>(
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
