import type * as AtomIO from "atom.io"
import type { Store, Transceiver } from "atom.io/internal"
import { createWritableTransientSelectorFamily } from "atom.io/internal"

import type { Canonical, Json, JsonInterface } from "."

export function selectJsonFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
>(
	store: Store,
	atomFamilyToken: AtomIO.MutableAtomFamilyToken<T, J, K>,
	transform: JsonInterface<T, J>,
): AtomIO.WritableTransientSelectorFamilyToken<J, K>
export function selectJsonFamily<
	T,
	J extends Json.Serializable,
	K extends Canonical,
>(
	store: Store,
	atomFamilyToken: AtomIO.RegularAtomFamilyToken<T, K>,
	transform: JsonInterface<T, J>,
): AtomIO.WritableTransientSelectorFamilyToken<J, K>
export function selectJsonFamily<
	T,
	J extends Json.Serializable,
	K extends Canonical,
>(
	store: Store,
	atomFamilyToken:
		| AtomIO.MutableAtomFamilyToken<T extends Transceiver<any> ? T : never, J, K>
		| AtomIO.RegularAtomFamilyToken<T, K>,
	transform: JsonInterface<T, J>,
): AtomIO.WritableTransientSelectorFamilyToken<J, K> {
	const jsonFamily = createWritableTransientSelectorFamily<J, K>(
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
	return jsonFamily
}
