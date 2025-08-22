import type { TransactionOutcomeEvent } from "atom.io"

import type { Store } from "../store"
import { ingestAtomUpdate } from "./ingest-atom-update"
import {
	ingestCreationEvent,
	ingestDisposalEvent,
	ingestMoleculeCreationEvent,
	ingestMoleculeDisposalEvent,
	ingestMoleculeTransferEvent,
} from "./ingest-creation-disposal"

export function ingestTransactionUpdate(
	applying: `newValue` | `oldValue`,
	outcome: TransactionOutcomeEvent<any>,
	store: Store,
): void {
	const subEvents =
		applying === `newValue`
			? outcome.subEvents
			: [...outcome.subEvents].reverse()
	for (const subEvent of subEvents) {
		switch (subEvent.type) {
			case `atom_update`:
				ingestAtomUpdate(applying, subEvent, store)
				break
			case `state_creation`:
				ingestCreationEvent(subEvent, applying, store)
				break
			case `state_disposal`:
				ingestDisposalEvent(subEvent, applying, store)
				break
			case `molecule_creation`:
				ingestMoleculeCreationEvent(subEvent, applying, store)
				break
			case `molecule_disposal`:
				ingestMoleculeDisposalEvent(subEvent, applying, store)
				break
			case `molecule_transfer`:
				ingestMoleculeTransferEvent(subEvent, applying, store)
				break
			case `transaction_outcome`:
				ingestTransactionUpdate(applying, subEvent, store)
				break
		}
	}
}
