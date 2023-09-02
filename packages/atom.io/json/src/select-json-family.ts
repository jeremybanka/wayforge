import * as AtomIO from "atom.io"

import type { Json, JsonInterface } from "."

export const selectJsonFamily = <
	T,
	J extends Json.Serializable,
	K extends Json.Serializable,
>(
	atomFamily: AtomIO.AtomFamily<T, K>,
	transform: JsonInterface<T, J>,
	store: AtomIO.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
): AtomIO.SelectorFamily<J, K> => {
	const jsonFamily = AtomIO.__INTERNAL__.selectorFamily__INTERNAL(
		{
			key: `${atomFamily.key}:JSON`,
			get: (key) => ({ get }) => transform.toJson(get(atomFamily(key))),
			set: (key) => ({ set }, newValue) =>
				set(atomFamily(key), transform.fromJson(newValue)),
		},
		store,
	)
	atomFamily.subject.subscribe(
		`select-json-family:${store.config.name}`,
		(token) => {
			jsonFamily(token.key)
		},
	)
	return jsonFamily
}
