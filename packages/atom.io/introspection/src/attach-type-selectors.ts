import type { ReadonlySelectorFamilyToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { createReadonlySelectorFamily } from "atom.io/internal"

import { discoverType } from "./refinery"

export const attachTypeSelectors = (
	store: Store,
): ReadonlySelectorFamilyToken<string, string> => {
	const typeSelectors = createReadonlySelectorFamily<string, string>(store, {
		key: `🔍 State Type`,
		get:
			(key) =>
			({ get }) => {
				let state: unknown
				try {
					const token =
						store.atoms.get(key) ??
						store.selectors.get(key) ??
						store.readonlySelectors.get(key)
					if (token === undefined) {
						throw new Error(`Could not find state with key "${key}"`)
					}
					state = get(token)
				} catch (thrown) {
					return `error`
				}
				const typeOfState = discoverType(state)
				return typeOfState
			},
	})
	return typeSelectors
}
