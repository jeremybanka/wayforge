import * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"

import type { ServerConfig } from "."

export const useReceiveTransaction = ({ socket, store }: ServerConfig) => {
	return function receiveTransaction<ƒ extends AtomIO.ƒn>(
		tx: AtomIO.TransactionToken<ƒ>,
	): () => void {
		const fillTransactionRequest = (update: AtomIO.TransactionUpdate<ƒ>) =>
			AtomIO.runTransaction<ƒ>(tx, store)(...update.params)

		socket.on(`tx:${tx.key}`, fillTransactionRequest)

		return () => socket.off(`tx:${tx.key}`, fillTransactionRequest)
	}
}

export function useSyncTransaction({
	socket,
	store = Internal.IMPLICIT.STORE,
}: ServerConfig) {
	return function receiveTransaction<ƒ extends AtomIO.ƒn>(
		tx: AtomIO.TransactionToken<ƒ>,
	): () => void {
		const fillTransactionRequest = (
			update: AtomIO.TransactionUpdate<ƒ>,
			transactionId: string,
		) => {
			const unsubscribe = Internal.subscribeToTransaction(
				tx,
				(update) => {
					unsubscribe()
					socket.emit(`tx:sync:${transactionId}`, update)
				},
				`sync:${transactionId}`,
				store,
			)
			AtomIO.runTransaction<ƒ>(tx, store)(...update.params)
		}

		socket.on(`tx:${tx.key}`, fillTransactionRequest)

		return () => socket.off(`tx:${tx.key}`, fillTransactionRequest)
	}
}
