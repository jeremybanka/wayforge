import * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"

import type { ServerConfig } from "."

const findUpdateToFilterState = AtomIO.atomFamily<
	AtomIO.TransactionUpdate<any> | null,
	string
>({
	key: `updateToFilter`,
	default: null,
})

const findUpdateFilterFunctionState = AtomIO.atomFamily<
	{
		filter: (
			updates: AtomIO.TransactionUpdateContent[],
		) => AtomIO.TransactionUpdateContent[]
	},
	string
>({
	key: `updateFilterFunction`,
	default: { filter: (updates) => updates },
})

const findFilteredUpdate = AtomIO.selectorFamily<
	AtomIO.TransactionUpdate<any> | null,
	[transactionKey: string, updateId: string]
>({
	key: `filteredUpdate`,
	get:
		([transactionKey, updateId]) =>
		({ get }) => {
			const update = get(findUpdateToFilterState(updateId))
			const { filter } = get(findUpdateFilterFunctionState(transactionKey))
			if (update && filter) {
				return {
					...update,
					updates: filter(update.updates),
				}
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
			AtomIO.setState(findUpdateFilterFunctionState(tx.key), { filter })
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
					const toEmit = filter
						? AtomIO.getState(findFilteredUpdate([tx.key, update.id]), store)
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
