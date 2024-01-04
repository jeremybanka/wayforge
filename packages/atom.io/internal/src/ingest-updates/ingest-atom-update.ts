import type { KeyedStateUpdate } from "atom.io"
import { setState } from "atom.io"

import type { Store } from "../store"

export function ingestAtomUpdate(
	applying: `newValue` | `oldValue`,
	atomUpdate: KeyedStateUpdate<any>,
	store: Store,
): void {
	const { key, newValue, oldValue } = atomUpdate
	const value = applying === `newValue` ? newValue : oldValue
	setState({ key, type: `atom` }, value, store)
}
