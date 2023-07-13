import type { ƒn } from "~/packages/anvl/src/function"

import type { Store } from ".."
import { withdraw } from ".."
import type { AtomToken, TransactionUpdate } from "../.."
import { setState } from "../.."

export const redoTransactionUpdate = <ƒ extends ƒn>(
	update: TransactionUpdate<ƒ>,
	store: Store,
): void => {
	store.config.logger?.info(` ⏭ redo transaction "${update.key}" (redo)`)
	for (const { key, newValue } of update.atomUpdates) {
		const token: AtomToken<unknown> = { key, type: `atom` }
		const state = withdraw(token, store)
		if (state === null) {
			throw new Error(
				`State "${token.key}" not found in this store. This is surprising, because we are navigating the history of the store.`,
			)
		}
		setState(state, newValue, store)
	}
}
