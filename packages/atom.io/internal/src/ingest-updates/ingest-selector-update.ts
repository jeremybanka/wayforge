import type { Store } from "../store"
import type { TimelineSelectorUpdate } from "../timeline"
import { ingestAtomUpdate } from "./ingest-atom-update"

export function ingestSelectorUpdate(
	applying: `newValue` | `oldValue`,
	selectorUpdate: TimelineSelectorUpdate<any>,
	store: Store,
): void {
	const updates =
		applying === `newValue`
			? selectorUpdate.atomUpdates
			: [...selectorUpdate.atomUpdates].reverse()
	for (const atomUpdate of updates) {
		ingestAtomUpdate(applying, atomUpdate, store)
	}
}
