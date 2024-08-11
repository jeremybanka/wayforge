import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import {
	createStandaloneSelector,
	findInStore,
	IMPLICIT,
} from "atom.io/internal"
import type { Canonical, stringified } from "atom.io/json"

export function dict<State, Key extends Canonical>(
	findState:
		| AtomIO.ReadonlySelectorFamilyToken<State, Key>
		| AtomIO.RegularAtomFamilyToken<State, Key>
		| AtomIO.WritableSelectorFamily<State, Key>,
	index:
		| AtomIO.ReadonlySelectorToken<Key[]>
		| AtomIO.RegularAtomToken<Key[]>
		| AtomIO.WritableSelectorToken<Key[]>,
	store: Store = IMPLICIT.STORE,
): AtomIO.ReadonlySelectorToken<{ [K in stringified<Key>]: State }> {
	return createStandaloneSelector(
		{
			key: `${findState.key}Dict`,
			get: ({ get }) => {
				const keys = get(index)
				return keys.reduce((acc, key) => {
					acc[key] = get(findInStore(findState, key, store))
					return acc
				}, {} as any)
			},
		},
		store,
	)
}
