import type * as AtomIO from "atom.io"
import type { Store, Transceiver } from "atom.io/internal"
import {
	createSelectorFamily,
	growMoleculeInStore,
	IMPLICIT,
	initFamilyMemberInStore,
	seekInStore,
} from "atom.io/internal"

import { createWritableSelectorFamily } from "../../internal/src/families/create-writable-selector-family"
import type { Canonical, Json, JsonInterface } from "."
import { parseJson, stringifyJson } from "."

export function selectJsonFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
>(
	atomFamily: AtomIO.MutableAtomFamily<T, J, K>,
	transform: JsonInterface<T, J>,
	store: Store,
): AtomIO.WritableSelectorFamily<J, K>
export function selectJsonFamily<
	T,
	J extends Json.Serializable,
	K extends Canonical,
>(
	atomFamily: AtomIO.RegularAtomFamily<T, K>,
	transform: JsonInterface<T, J>,
	store: Store,
): AtomIO.WritableSelectorFamily<J, K>
export function selectJsonFamily<
	T,
	J extends Json.Serializable,
	K extends Canonical,
>(
	family:
		| AtomIO.MutableAtomFamily<T extends Transceiver<any> ? T : never, J, K>
		| AtomIO.RegularAtomFamily<T, K>,
	transform: JsonInterface<T, J>,
	store: Store = IMPLICIT.STORE,
): AtomIO.WritableSelectorFamily<J, K> {
	const jsonFamily = createWritableSelectorFamily<J, K>(
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
						const atom = growMoleculeInStore(molecule, family, store)
						return transform.toJson(get(atom))
					}
					if (store.config.lifespan === `immortal`) {
						throw new Error(`No molecule found for key "${stringKey}"`)
					}
					const newToken = initFamilyMemberInStore(family, key, store)
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
							const atom = growMoleculeInStore(molecule, family, store)
							set(atom, transform.fromJson(newValue))
						} else {
							if (store.config.lifespan === `immortal`) {
								throw new Error(`No molecule found for key "${stringKey}"`)
							}
							set(
								initFamilyMemberInStore(family, key, store),
								transform.fromJson(newValue),
							)
						}
					}
				},
		},
		store,
		[`mutable`, `json`],
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
