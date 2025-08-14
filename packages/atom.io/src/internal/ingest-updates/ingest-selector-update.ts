import type {
	TimelineAtomUpdateEvent,
	TimelineManageable,
	TimelineSelectorUpdateEvent,
} from "atom.io"

import type { Store } from "../store"
import { ingestAtomUpdate } from "./ingest-atom-update"

export function ingestSelectorUpdate(
	applying: `newValue` | `oldValue`,
	selectorUpdate: TimelineSelectorUpdateEvent<any>,
	store: Store,
): void {
	let updates: Omit<TimelineAtomUpdateEvent<TimelineManageable>, `timestamp`>[]
	if (applying === `newValue`) {
		updates = selectorUpdate.atomUpdates
	} else {
		updates = selectorUpdate.atomUpdates.toReversed()
	}
	for (const atomUpdate of updates) {
		ingestAtomUpdate(applying, atomUpdate, store)
	}
}
