import * as AtomIO from "atom.io"

import type { Json, JsonInterface } from "."
import { parseJson } from "."

export const selectJsonFamily = <
	T,
	J extends Json.Serializable,
	K extends Json.Serializable,
>(
	atomFamily: AtomIO.AtomFamily<T, K>,
	transform: JsonInterface<T, J>,
	store: AtomIO.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
): AtomIO.SelectorFamily<J, K> => {
	const jsonFamily = AtomIO.__INTERNAL__.createSelectorFamily<J, K>(
		{
			key: `${atomFamily.key}:JSON`,
			get: (key) => ({ get }) => transform.toJson(get(atomFamily(key))),
			set: (key) => ({ set }, newValue) =>
				set(atomFamily(key), transform.fromJson(newValue)),
		},
		store,
	)
	atomFamily.subject.subscribe(
		`store=${store.config.name}::json-selector-family`,
		(token) => {
			if (token.family) {
				jsonFamily(parseJson(token.family.subKey) as K)
			}
		},
	)
	return jsonFamily
}
