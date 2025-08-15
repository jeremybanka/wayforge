import type { AtomUpdateEvent } from "atom.io"

import { setIntoStore } from "../set-state"
import type { Store } from "../store"

export function ingestAtomUpdate(
	applying: `newValue` | `oldValue`,
	atomUpdate: AtomUpdateEvent<any>,
	store: Store,
): void {
	const {
		token,
		update: { newValue, oldValue },
	} = atomUpdate
	const value = applying === `newValue` ? newValue : oldValue

	setIntoStore(store, token, value)
}
