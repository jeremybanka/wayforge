import type { TransactionUpdate } from "atom.io"

import type { Store } from "../store"
import { isRootStore } from "../transaction/is-root-store"
import { ingestAtomUpdate } from "./ingest-atom-update"

export function ingestTransactionUpdate(
	applying: `newValue` | `oldValue`,
	transactionUpdate: TransactionUpdate<any>,
	store: Store,
): void {
	const updates =
		applying === `newValue`
			? transactionUpdate.updates
			: [...transactionUpdate.updates].reverse()
	for (const updateFromTransaction of updates) {
		if (`newValue` in updateFromTransaction) {
			ingestAtomUpdate(applying, updateFromTransaction, store)
		} else {
			ingestTransactionUpdate(applying, updateFromTransaction, store)
		}
	}
}
