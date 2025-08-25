import type {
	AtomOnly,
	AtomUpdateEvent,
	StateCreationEvent,
	TimelineManageable,
	TimelineSelectorUpdateEvent,
} from "atom.io"

import type { Store } from "../store"
import { ingestAtomUpdateEvent } from "./ingest-atom-update"
import { ingestCreationEvent } from "./ingest-creation-disposal"

export function ingestSelectorUpdateEvent(
	store: Store,
	selectorUpdate: TimelineSelectorUpdateEvent<any>,
	applying: `newValue` | `oldValue`,
): void {
	let updates: (
		| AtomUpdateEvent<AtomOnly<TimelineManageable>>
		| StateCreationEvent<any>
	)[]
	if (applying === `newValue`) {
		updates = selectorUpdate.atomUpdates
	} else {
		updates = selectorUpdate.atomUpdates.toReversed()
	}
	for (const atomUpdate of updates) {
		if (atomUpdate.type === `state_creation`) {
			ingestCreationEvent(store, atomUpdate, applying)
		} else {
			ingestAtomUpdateEvent(store, atomUpdate, applying)
		}
	}
}
