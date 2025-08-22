import type { SelectorSubEvent, SelectorUpdateEvent } from "atom.io"

import type { Store } from "../store"
import { ingestAtomUpdate } from "./ingest-atom-update"
import { ingestCreationEvent } from "./ingest-creation-disposal"

export function ingestSelectorUpdate(
	applying: `newValue` | `oldValue`,
	selectorUpdate: SelectorUpdateEvent<any>,
	store: Store,
): void {
	let events: SelectorSubEvent<any>[]
	if (applying === `newValue`) {
		events = selectorUpdate.subEvents
	} else {
		events = selectorUpdate.subEvents.toReversed()
	}
	for (const event of events) {
		switch (event.type) {
			case `atom_update`:
				ingestAtomUpdate(applying, event, store)
				break
			case `state_creation`:
				ingestCreationEvent(event, applying, store)
		}
	}
}
