import * as AtomIO from "atom.io"

import type { Json, JsonInterface } from "."

export const selectJson = <T, J extends Json.Serializable>(
	atom: AtomIO.AtomToken<T>,
	transform: JsonInterface<T, J>,
	store: AtomIO.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
): AtomIO.SelectorToken<J> =>
	AtomIO.__INTERNAL__.selector__INTERNAL(
		{
			key: `${atom.key}:JSON`,
			get: ({ get }) => transform.toJson(get(atom)),
			set: ({ set }, newValue) => set(atom, transform.fromJson(newValue)),
		},
		undefined,
		store,
	)
