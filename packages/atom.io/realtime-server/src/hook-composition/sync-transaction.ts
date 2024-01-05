import * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"

import type { ServerConfig } from "."

export function useSyncTransaction({
	socket,
	store = Internal.IMPLICIT.STORE,
}: ServerConfig) {
	return function syncTransaction<ƒ extends AtomIO.ƒn>(
		tx: AtomIO.TransactionToken<ƒ>,
	): () => void {
		const fillTransactionRequest = (update: AtomIO.TransactionUpdate<ƒ>) => {
			AtomIO.runTransaction<ƒ>(tx, store, update.id)(...update.params)
		}
		socket.on(`tx-run:${tx.key}`, fillTransactionRequest)

		const fillTransactionSubscriptionRequest = () => {
			const unsubscribe = Internal.subscribeToTransaction(
				tx,
				(update) => {
					unsubscribe()
					socket.emit(`tx-new:${tx.key}`, update)
				},
				`tx-sub:${tx.key}:${socket.id}`,
				store,
			)
			socket.on(`tx-unsub:${tx.key}`, unsubscribe)
		}
		socket.on(`tx-sub:${tx.key}`, fillTransactionSubscriptionRequest)

		return () => {
			socket.off(`tx-run:${tx.key}`, fillTransactionRequest)
		}
	}
}
