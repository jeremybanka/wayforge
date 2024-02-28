import type { KeyedStateUpdate, RegularAtomToken } from "atom.io"

import { setIntoStore } from "../set-state"
import type { Store } from "../store"

export function ingestAtomUpdate(
	applying: `newValue` | `oldValue`,
	atomUpdate: KeyedStateUpdate<any>,
	store: Store,
): void {
	const { key, newValue, oldValue } = atomUpdate
	const value = applying === `newValue` ? newValue : oldValue
	const token: RegularAtomToken<unknown> = { key, type: `atom` }
	if (atomUpdate.family) {
		Object.assign(token, { family: atomUpdate.family })
	}
	setIntoStore(token, value, store)
}
