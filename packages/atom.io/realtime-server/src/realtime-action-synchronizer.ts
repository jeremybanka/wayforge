import * as AtomIO from "atom.io"
import { IMPLICIT, subscribeToTransaction } from "atom.io/internal"

import type { ServerConfig } from "."
import {
	completeUpdateAtoms,
	redactedUpdateSelectors,
	transactionRedactorAtoms,
} from "./realtime-server-store"

export type ActionSynchronizer = ReturnType<typeof realtimeActionSynchronizer>
export function realtimeActionSynchronizer({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function actionSynchronizer<ƒ extends AtomIO.ƒn>(
		tx: AtomIO.TransactionToken<ƒ>,
		filter?: (
			update: AtomIO.TransactionUpdateContent[],
		) => AtomIO.TransactionUpdateContent[],
	): () => void {
		if (filter) {
			AtomIO.setState(
				AtomIO.findState(transactionRedactorAtoms, tx.key),
				{ filter },
				store,
			)
		}
		const fillTransactionRequest = (update: AtomIO.TransactionUpdate<ƒ>) => {
			AtomIO.runTransaction<ƒ>(tx, store, update.id)(...update.params)
		}
		socket.on(`tx-run:${tx.key}`, fillTransactionRequest)

		const fillTransactionSubscriptionRequest = () => {
			const unsubscribe = subscribeToTransaction(
				tx,
				(update) => {
					unsubscribe()
					const updateState = AtomIO.findState(completeUpdateAtoms, update.id)
					AtomIO.setState(updateState, update, store)
					const toEmit = filter
						? AtomIO.getState(
								AtomIO.findState(redactedUpdateSelectors, [tx.key, update.id]),
								store,
						  )
						: update
					socket.emit(`tx-new:${tx.key}`, toEmit)
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
