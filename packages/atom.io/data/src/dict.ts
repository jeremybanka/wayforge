import * as AtomIO from "atom.io"
import { IMPLICIT, Store, createSelector } from "atom.io/internal"
import { Json, Stringified } from "atom.io/json"

export function dict<State, Key extends Json.Serializable>(
	findState:
		| AtomIO.AtomFamily<State, Key>
		| AtomIO.SelectorFamily<State, Key>
		| AtomIO.ReadonlySelectorFamily<State, Key>,
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
