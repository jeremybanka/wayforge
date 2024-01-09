import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import { IMPLICIT, createStandaloneSelector } from "atom.io/internal"
import type { Json, Stringified } from "atom.io/json"

export function dict<State, Key extends Json.Serializable>(
	findState:
		| AtomIO.ReadonlySelectorFamily<State, Key>
		| AtomIO.RegularAtomFamily<State, Key>
		| AtomIO.WritableSelectorFamily<State, Key>,
	index:
		| AtomIO.ReadonlySelectorToken<Key[]>
		| AtomIO.RegularAtomToken<Key[]>
		| AtomIO.WritableSelectorToken<Key[]>,
	store: Store = IMPLICIT.STORE,
): AtomIO.ReadonlySelectorToken<{ [K in Stringified<Key>]: State }> {
	return createStandaloneSelector(
		{
			key: `${findState.key}Dict`,
			get: ({ get }) => {
				const keys = get(index)
				return keys.reduce((acc, key) => {
					acc[key] = get(findState(key))
					return acc
				}, {} as any)
			},
		},
		store,
	)
}
