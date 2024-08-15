import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import {
	createStandaloneSelector,
	findInStore,
	IMPLICIT,
} from "atom.io/internal"
import type { Canonical, stringified } from "atom.io/json"

export function dict<State, Key extends Canonical>(
	family:
		| AtomIO.ReadonlySelectorFamilyToken<State, Key>
		| AtomIO.RegularAtomFamilyToken<State, Key>
		| AtomIO.WritableSelectorFamilyToken<State, Key>,
	index:
		| AtomIO.ReadonlySelectorToken<Key[]>
		| AtomIO.RegularAtomToken<Key[]>
		| AtomIO.WritableSelectorToken<Key[]>,
	store: Store = IMPLICIT.STORE,
): AtomIO.ReadonlySelectorToken<{ [K in stringified<Key>]: State }> {
	return createStandaloneSelector(
		{
			key: `${family.key}Dict`,
			get: ({ get }) => {
				const keys = get(index)
				return keys.reduce((acc, key) => {
					acc[key] = get(findInStore(store, family, key))
					return acc
				}, {} as any)
			},
		},
		store,
	)
}
