import type * as AtomIO from "atom.io"
import type { Store, Transceiver } from "atom.io/internal"
import { createSelectorFamily, IMPLICIT } from "atom.io/internal"

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
				({ get }) =>
					transform.toJson(get(family(key))),
			set:
				(key) =>
				({ set }, newValue) => {
					set(family(key), transform.fromJson(newValue))
				},
		},
		store,
	)
	family.subject.subscribe(
		`store=${store.config.name}::json-selector-family`,
		(token) => {
			if (token.family) {
				jsonFamily(parseJson(token.family.subKey) as K)
			}
		},
	)
	return jsonFamily
}
