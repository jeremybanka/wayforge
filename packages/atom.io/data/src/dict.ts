import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import { IMPLICIT, createSelector } from "atom.io/internal"
import type { Json, Stringified } from "atom.io/json"

export function dict<State, Key extends Json.Serializable>(
	findState:
		| AtomIO.AtomFamily<State, Key>
		| AtomIO.ReadonlySelectorFamily<State, Key>
		| AtomIO.SelectorFamily<State, Key>,
	index:
		| AtomIO.AtomToken<Key[]>
		| AtomIO.ReadonlySelectorToken<Key[]>
		| AtomIO.SelectorToken<Key[]>,
	store: Store = IMPLICIT.STORE,
): AtomIO.ReadonlySelectorToken<{ [K in Stringified<Key>]: State }> {
	return createSelector(
		{
			key: `dict`,
			get: ({ get }) => {
				const keys = get(index)
				return keys.reduce((acc, key) => {
					acc[key] = get(findState(key))
					return acc
				}, {} as any)
			},
		},
		undefined,
		store,
	)
}
