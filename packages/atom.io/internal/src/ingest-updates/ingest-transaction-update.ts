import type { TransactionUpdate } from "atom.io"

import type { Store } from "../store"
import { ingestAtomUpdate } from "./ingest-atom-update"
import {
	ingestCreationEvent,
	ingestDisposalEvent,
	ingestMoleculeCreationEvent,
	ingestMoleculeDisposalEvent,
} from "./ingest-creation-disposal"

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
		switch (updateFromTransaction.type) {
			case `atom_update`:
			case `selector_update`:
				ingestAtomUpdate(applying, updateFromTransaction, store)
				break
			case `state_creation`:
				ingestCreationEvent(updateFromTransaction, applying, store)
				break
			case `state_disposal`:
				ingestDisposalEvent(updateFromTransaction, applying, store)
				break
			case `molecule_creation`:
				ingestMoleculeCreationEvent(updateFromTransaction, applying, store)
				break
			case `molecule_disposal`:
				ingestMoleculeDisposalEvent(updateFromTransaction, applying, store)
				break
			case `transaction_update`:
				ingestTransactionUpdate(applying, updateFromTransaction, store)
				break
		}
	}
}
