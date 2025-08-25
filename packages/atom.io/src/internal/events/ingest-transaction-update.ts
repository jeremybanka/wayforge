import type { TransactionOutcomeEvent } from "atom.io"

import type { Store } from "../store"
import { ingestAtomUpdateEvent } from "./ingest-atom-update"
import {
	ingestCreationEvent,
	ingestDisposalEvent,
	ingestMoleculeCreationEvent,
	ingestMoleculeDisposalEvent,
	ingestMoleculeTransferEvent,
} from "./ingest-creation-disposal"

export function ingestTransactionOutcomeEvent(
	store: Store,
	event: TransactionOutcomeEvent<any>,
	applying: `newValue` | `oldValue`,
): void {
	const subEvents =
		applying === `newValue` ? event.subEvents : [...event.subEvents].reverse()
	for (const subEvent of subEvents) {
		switch (subEvent.type) {
			case `atom_update`:
				ingestAtomUpdateEvent(store, subEvent, applying)
				break
			case `state_creation`:
				ingestCreationEvent(store, subEvent, applying)
				break
			case `state_disposal`:
				ingestDisposalEvent(store, subEvent, applying)
				break
			case `molecule_creation`:
				ingestMoleculeCreationEvent(store, subEvent, applying)
				break
			case `molecule_disposal`:
				ingestMoleculeDisposalEvent(store, subEvent, applying)
				break
			case `molecule_transfer`:
				ingestMoleculeTransferEvent(store, subEvent, applying)
				break
			case `transaction_outcome`:
				ingestTransactionOutcomeEvent(store, subEvent, applying)
				break
		}
	}
}
