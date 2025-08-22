import type {
	AtomOnly,
	AtomUpdateEvent,
	TimelineManageable,
	TimelineSelectorUpdateEvent,
} from "atom.io"

import type { Store } from "../store"
import { ingestAtomUpdateEvent } from "./ingest-atom-update"

export function ingestSelectorUpdateEvent(
	store: Store,
	selectorUpdate: TimelineSelectorUpdateEvent<any>,
	applying: `newValue` | `oldValue`,
): void {
	let updates: AtomUpdateEvent<AtomOnly<TimelineManageable>>[]
	if (applying === `newValue`) {
		updates = selectorUpdate.atomUpdates
	} else {
		updates = selectorUpdate.atomUpdates.toReversed()
	}
	for (const atomUpdate of updates) {
		ingestAtomUpdateEvent(store, atomUpdate, applying)
	}
}
