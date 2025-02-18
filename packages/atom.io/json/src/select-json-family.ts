import type * as AtomIO from "atom.io"
import type { Store, Transceiver } from "atom.io/internal"
import { IMPLICIT, seekInStore, withdraw } from "atom.io/internal"

import { createWritableSelectorFamily } from "../../internal/src/families/create-writable-selector-family"
import type { Canonical, Json, JsonInterface } from "."
import { parseJson } from "."

export function selectJsonFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
>(
	atomFamilyToken: AtomIO.MutableAtomFamilyToken<T, J, K>,
	transform: JsonInterface<T, J>,
	store: Store,
): AtomIO.WritableSelectorFamilyToken<J, K>
export function selectJsonFamily<
	T,
	J extends Json.Serializable,
	K extends Canonical,
>(
	atomFamilyToken: AtomIO.RegularAtomFamilyToken<T, K>,
	transform: JsonInterface<T, J>,
	store: Store,
): AtomIO.WritableSelectorFamilyToken<J, K>
export function selectJsonFamily<
	T,
	J extends Json.Serializable,
	K extends Canonical,
>(
	atomFamilyToken:
		| AtomIO.MutableAtomFamilyToken<T extends Transceiver<any> ? T : never, J, K>
		| AtomIO.RegularAtomFamilyToken<T, K>,
	transform: JsonInterface<T, J>,
	store: Store = IMPLICIT.STORE,
): AtomIO.WritableSelectorFamilyToken<J, K> {
	const jsonFamily = createWritableSelectorFamily<J, K>(
		store,
		{
			key: `${atomFamilyToken.key}:JSON`,
			get:
				(key) =>
				({ get }) => {
					const baseState = get(atomFamilyToken, key)
					return transform.toJson(baseState)
				},
			set:
				(key) =>
				({ set }, newValue) => {
					set(atomFamilyToken, key, transform.fromJson(newValue))
				},
		},
		[`mutable`, `json`],
	)
	const atomFamily = withdraw(atomFamilyToken, store)
	atomFamily.subject.subscribe(
		`store=${store.config.name}::json-selector-family`,
		(event) => {
			if (event.token.family) {
				seekInStore(store, jsonFamily, parseJson(event.token.family.subKey) as K)
			}
		},
	)
	return jsonFamily
}
