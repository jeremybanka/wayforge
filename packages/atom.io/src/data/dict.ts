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
		| AtomIO.ReadonlyPureSelectorFamilyToken<State, Key>
		| AtomIO.RegularAtomFamilyToken<State, Key>
		| AtomIO.WritablePureSelectorFamilyToken<State, Key>,
	index:
		| AtomIO.ReadonlyPureSelectorToken<Key[]>
		| AtomIO.RegularAtomToken<Key[]>
		| AtomIO.WritablePureSelectorToken<Key[]>,
	store: Store = IMPLICIT.STORE,
): AtomIO.ReadonlyPureSelectorToken<{ [K in stringified<Key>]: State }> {
	return createStandaloneSelector(store, {
		key: `${family.key}Dict`,
		get: ({ get }) => {
			const keys = get(index)
			return keys.reduce((acc, key) => {
				acc[key] = get(findInStore(store, family, key))
				return acc
			}, {} as any)
		},
	})
}
