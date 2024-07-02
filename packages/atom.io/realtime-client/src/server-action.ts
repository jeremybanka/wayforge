import type * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"
import type { Socket } from "socket.io-client"

export function serverAction<F extends Internal.Func>(
	token: AtomIO.TransactionToken<F>,
	socket: Socket,
	store: Internal.Store,
): () => void {
	const unsubscribeFromLocalUpdates = Internal.subscribeToTransaction(
		token,
		(clientUpdate) => {
			socket.emit(`tx-run:${token.key}`, clientUpdate)
		},
		`tx-run:${token.key}:${socket.id}`,
		store,
	)

	return () => {
		unsubscribeFromLocalUpdates()
	}
}
