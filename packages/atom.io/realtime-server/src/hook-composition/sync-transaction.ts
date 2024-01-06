import * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"

import type { ServerConfig } from "."

const completeUpdateAtoms = AtomIO.atomFamily<
	AtomIO.TransactionUpdate<any> | null,
	string
>({
	key: `completeUpdate`,
	default: null,
})

const transactionRedactorAtoms = AtomIO.atomFamily<
	{
		filter: (
			updates: AtomIO.TransactionUpdateContent[],
		) => AtomIO.TransactionUpdateContent[]
	},
	string
>({
	key: `transactionRedactor`,
	default: { filter: (updates) => updates },
})

const redactedUpdateSelectors = AtomIO.selectorFamily<
	AtomIO.TransactionUpdate<any> | null,
	[transactionKey: string, updateId: string]
>({
	key: `redactedUpdate`,
	get:
		([transactionKey, updateId]) =>
		({ get, find }) => {
			const update = get(find(completeUpdateAtoms, updateId))
			const { filter } = get(find(transactionRedactorAtoms, transactionKey))

			if (update && filter) {
				return { ...update, updates: filter(update.updates) }
			}
			return null
		},
})

export function useSyncTransaction({
	socket,
	store = Internal.IMPLICIT.STORE,
}: ServerConfig) {
	return function syncTransaction<ƒ extends AtomIO.ƒn>(
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
			const unsubscribe = Internal.subscribeToTransaction(
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
