import type { TimelineManageable } from "atom.io"

import type { Store } from "../store"
import type { TimelineAtomUpdate, TimelineSelectorUpdate } from "../timeline"
import { ingestAtomUpdate } from "./ingest-atom-update"

export function ingestSelectorUpdate(
	applying: `newValue` | `oldValue`,
	selectorUpdate: TimelineSelectorUpdate<any>,
	store: Store,
): void {
	let updates: Omit<TimelineAtomUpdate<TimelineManageable>, `timestamp`>[]
	if (applying === `newValue`) {
		updates = selectorUpdate.atomUpdates
	} else {
		updates = selectorUpdate.atomUpdates.toReversed()
	}
	for (const atomUpdate of updates) {
		ingestAtomUpdate(applying, atomUpdate, store)
	}
}
