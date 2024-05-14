import type * as AtomIO from "atom.io"
import type { Store, Transceiver } from "atom.io/internal"
import { createSelectorFamily, findInStore, IMPLICIT } from "atom.io/internal"

import type { Json, JsonInterface } from "."
import { parseJson } from "."

export function selectJsonFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
>(
	atomFamily: AtomIO.MutableAtomFamily<T, J, K>,
	transform: JsonInterface<T, J>,
	store: Store,
): AtomIO.WritableSelectorFamily<J, K>
export function selectJsonFamily<
	T,
	J extends Json.Serializable,
	K extends Json.Serializable,
>(
	atomFamily: AtomIO.RegularAtomFamily<T, K>,
	transform: JsonInterface<T, J>,
	store: Store,
): AtomIO.WritableSelectorFamily<J, K>
export function selectJsonFamily<
	T,
	J extends Json.Serializable,
	K extends Json.Serializable,
>(
	family:
		| AtomIO.MutableAtomFamily<T extends Transceiver<any> ? T : never, J, K>
		| AtomIO.RegularAtomFamily<T, K>,
	transform: JsonInterface<T, J>,
	store: Store = IMPLICIT.STORE,
): AtomIO.WritableSelectorFamily<J, K> {
	const jsonFamily = createSelectorFamily<J, K>(
		{
			key: `${family.key}:JSON`,
			get:
				(key) =>
				({ find, get }) =>
					transform.toJson(get(find(family, key))),
			set:
				(key) =>
				({ find, set }, newValue) => {
					set(find(family, key), transform.fromJson(newValue))
				},
		},
		store,
	)
	family.subject.subscribe(
		`store=${store.config.name}::json-selector-family`,
		(token) => {
			if (token.family) {
				findInStore(jsonFamily, parseJson(token.family.subKey) as K, store)
			}
		},
	)
	return jsonFamily
}
