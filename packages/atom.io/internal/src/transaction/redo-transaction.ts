import type { AtomToken, TransactionUpdate, ƒn } from "atom.io"
import { setState } from "atom.io"

import { withdraw } from "../store"
import type { Store } from "../store"

export const redoTransactionUpdate = <ƒ extends ƒn>(
	update: TransactionUpdate<ƒ>,
	store: Store,
): void => {
	store.logger.info(` ⏭ Redo transaction "${update.key}"`)
	for (const { key, newValue } of update.atomUpdates) {
		const token: AtomToken<unknown> = { key, type: `atom` }
		const state = withdraw(token, store)
		if (state === undefined) {
			throw new Error(
				`State "${token.key}" not found in this store. This is surprising, because we are navigating the history of the store.`,
			)
		}
		setState(state, newValue, store)
	}
}
