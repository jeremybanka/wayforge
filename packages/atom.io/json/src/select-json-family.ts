import type * as AtomIO from "atom.io"
import type { Store, Transceiver } from "atom.io/internal"
import {
	growMoleculeInStore,
	IMPLICIT,
	initFamilyMemberInStore,
	seekInStore,
	withdraw,
} from "atom.io/internal"

import { createWritableSelectorFamily } from "../../internal/src/families/create-writable-selector-family"
import type { Canonical, Json, JsonInterface } from "."
import { parseJson, stringifyJson } from "."

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
				({ seek, get }) => {
					const existingState = seek(atomFamilyToken, key)
					if (existingState) {
						return transform.toJson(get(existingState))
					}
					const stringKey = stringifyJson(key)
					const molecule = store.molecules.get(stringKey)
					if (molecule) {
						const atom = growMoleculeInStore(molecule, atomFamilyToken, store)
						return transform.toJson(get(atom))
					}
					if (store.config.lifespan === `immortal`) {
						throw new Error(`No molecule found for key "${stringKey}"`)
					}
					const newToken = initFamilyMemberInStore(store, atomFamilyToken, key)
					return transform.toJson(get(newToken))
				},
			set:
				(key) =>
				({ seek, set }, newValue) => {
					const existingState = seek(atomFamilyToken, key)
					if (existingState) {
						set(existingState, transform.fromJson(newValue))
					} else {
						const stringKey = stringifyJson(key)
						const molecule = store.molecules.get(stringKey)
						if (molecule) {
							const atom = growMoleculeInStore(molecule, atomFamilyToken, store)
							set(atom, transform.fromJson(newValue))
						} else {
							if (store.config.lifespan === `immortal`) {
								throw new Error(`No molecule found for key "${stringKey}"`)
							}
							set(
								initFamilyMemberInStore(store, atomFamilyToken, key),
								transform.fromJson(newValue),
							)
						}
					}
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
