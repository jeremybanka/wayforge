import type { ReadonlySelectorFamilyToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { createReadonlySelectorFamily, IMPLICIT } from "atom.io/internal"

import { discoverType } from "./refinery"

export const attachTypeSelectors = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorFamilyToken<string, string> => {
	const typeSelectors = createReadonlySelectorFamily<string, string>(store, {
		key: `👁‍🗨 State Type`,
		get:
			(token) =>
			({ get }) => {
				let state: unknown
				try {
					state = get(token as any)
				} catch (error) {
					return `error`
				}
				const typeOfState = discoverType(state)
				return typeOfState
			},
	})
	return typeSelectors
}
