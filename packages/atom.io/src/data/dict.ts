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
		| AtomIO.ReadonlyTransientSelectorFamilyToken<State, Key>
		| AtomIO.RegularAtomFamilyToken<State, Key>
		| AtomIO.WritableTransientSelectorFamilyToken<State, Key>,
	index:
		| AtomIO.ReadonlyTransientSelectorToken<Key[]>
		| AtomIO.RegularAtomToken<Key[]>
		| AtomIO.WritableTransientSelectorToken<Key[]>,
	store: Store = IMPLICIT.STORE,
): AtomIO.ReadonlyTransientSelectorToken<{ [K in stringified<Key>]: State }> {
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
