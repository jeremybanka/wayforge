import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import { createStandaloneSelector, IMPLICIT } from "atom.io/internal"

import type { Json, JsonInterface } from "."

export const selectJson = <T, J extends Json.Serializable>(
	atom: AtomIO.AtomToken<T>,
	transform: JsonInterface<T, J>,
	store: Store = IMPLICIT.STORE,
): AtomIO.WritableSelectorToken<J> => {
	return createStandaloneSelector(store, {
		key: `${atom.key}:JSON`,
		get: ({ get }) => transform.toJson(get(atom)),
		set: ({ set }, newValue) => {
			set(atom, transform.fromJson(newValue))
		},
	})
}
