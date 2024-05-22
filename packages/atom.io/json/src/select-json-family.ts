import type * as AtomIO from "atom.io"
import type { Store, Transceiver } from "atom.io/internal"
import {
	createSelectorFamily,
	IMPLICIT,
	initFamilyMember,
	seekInStore,
} from "atom.io/internal"

import type { Json, JsonInterface } from "."
import { parseJson, stringifyJson } from "."

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
				({ seek, get }) => {
					const existingState = seek(family, key)
					if (existingState) {
						return transform.toJson(get(existingState))
					}
					const stringKey = stringifyJson(key)
					const molecule = store.molecules.get(stringKey)
					if (molecule) {
						const atom = molecule.bond(family)
						return transform.toJson(get(atom))
					}
					if (store.config.lifespan === `immortal`) {
						throw new Error(`No molecule found for key "${stringKey}"`)
					}
					const newToken = initFamilyMember(family, key, store)
					return transform.toJson(get(newToken))
				},
			set:
				(key) =>
				({ seek, set }, newValue) => {
					const existingState = seek(family, key)
					if (existingState) {
						set(existingState, transform.fromJson(newValue))
					} else {
						const stringKey = stringifyJson(key)
						const molecule = store.molecules.get(stringKey)
						if (molecule) {
							const atom = molecule.bond(family)
							set(atom, transform.fromJson(newValue))
						} else {
							if (store.config.lifespan === `immortal`) {
								throw new Error(`No molecule found for key "${stringKey}"`)
							}
							set(
								initFamilyMember(family, key, store),
								transform.fromJson(newValue),
							)
						}
					}
				},
		},
		store,
	)
	family.subject.subscribe(
		`store=${store.config.name}::json-selector-family`,
		(event) => {
			if (event.token.family) {
				seekInStore(jsonFamily, parseJson(event.token.family.subKey) as K, store)
			}
		},
	)
	return jsonFamily
}
