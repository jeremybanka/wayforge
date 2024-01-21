import type { KeyedStateUpdate } from "atom.io"

import { setIntoStore } from "../set-state"
import type { Store } from "../store"

export function ingestAtomUpdate(
	applying: `newValue` | `oldValue`,
	atomUpdate: KeyedStateUpdate<any>,
	store: Store,
): void {
	const { key, newValue, oldValue } = atomUpdate
	const value = applying === `newValue` ? newValue : oldValue
	setIntoStore({ key, type: `atom` }, value, store)
}
