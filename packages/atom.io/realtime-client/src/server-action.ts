import type * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"
import type { Socket } from "socket.io-client"

export function serverAction<F extends Internal.Func>(
	store: Internal.Store,
	socket: Socket,
	token: AtomIO.TransactionToken<F>,
): () => void {
	const unsubscribeFromLocalUpdates = Internal.subscribeToTransaction(
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
