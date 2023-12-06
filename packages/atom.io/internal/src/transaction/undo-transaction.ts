import type { AtomToken, TransactionUpdate, ƒn } from "atom.io"
import { setState } from "atom.io"

import { withdraw } from "../store"
import type { Store } from "../store"

export const undoTransactionUpdate = <ƒ extends ƒn>(
	transactionUpdate: TransactionUpdate<ƒ>,
	store: Store,
): void => {
	store.logger.info(`⏮️`, `transaction`, transactionUpdate.key, `Undo`)
	for (const update of transactionUpdate.updates.reverse()) {
		if (`newValue` in update) {
			const { key, newValue } = update
			const token: AtomToken<unknown> = { key, type: `atom` }
			const state = withdraw(token, store)
			if (state === undefined) {
				throw new Error(
					`State "${token.key}" not found in this store. This is surprising, because we are navigating the history of the store.`,
				)
			}
			setState(state, newValue, store)
		} else {
			undoTransactionUpdate(update, store)
		}
	}
}
