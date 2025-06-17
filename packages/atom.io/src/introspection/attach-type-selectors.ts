import type { ReadonlyPureSelectorFamilyToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { createReadonlyPureSelectorFamily } from "atom.io/internal"

import { discoverType } from "./refinery"

export const attachTypeSelectors = (
	store: Store,
): ReadonlyPureSelectorFamilyToken<string, string> => {
	const typeSelectors = createReadonlyPureSelectorFamily<string, string>(store, {
		key: `🔍 State Type`,
		get:
			(key) =>
			({ get }) => {
				let state: unknown
				try {
					const token =
						store.atoms.get(key) ??
						store.writableSelectors.get(key) ??
						store.readonlySelectors.get(key)
					if (token === undefined) {
						throw new Error(`Could not find state with key "${key}"`)
					}
					state = get(token)
				} catch (_) {
					return `error`
				}
				const typeOfState = discoverType(state)
				return typeOfState
			},
	})
	return typeSelectors
}
