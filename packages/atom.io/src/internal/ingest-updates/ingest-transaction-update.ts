import type { TransactionOutcomeEvent } from "atom.io"

import type { Store } from "../store"
import { ingestAtomUpdate } from "./ingest-atom-update"
import {
	ingestMoleculeCreationEvent,
	ingestMoleculeDisposalEvent,
	ingestMoleculeTransferEvent,
} from "./ingest-creation-disposal"

export function ingestTransactionUpdate(
	applying: `newValue` | `oldValue`,
	transactionUpdate: TransactionOutcomeEvent<any>,
	store: Store,
): void {
	const events =
		applying === `newValue`
			? transactionUpdate.events
			: [...transactionUpdate.events].reverse()
	for (const event of events) {
		switch (event.type) {
			case `update`:
				ingestAtomUpdate(applying, event, store)
				break
			case `molecule_creation`:
				ingestMoleculeCreationEvent(event, applying, store)
				break
			case `molecule_disposal`:
				ingestMoleculeDisposalEvent(event, applying, store)
				break
			case `molecule_transfer`:
				ingestMoleculeTransferEvent(event, applying, store)
				break
			case `transaction_update`:
				ingestTransactionUpdate(applying, event, store)
				break
		}
	}
}
