import type {
	AtomFamilyToken,
	AtomToken,
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeKey,
	MoleculeToken,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorFamilyToken,
	SelectorToken,
	WritableFamilyToken,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type { seekState } from "atom.io/immortal"
import { type Json, stringifyJson } from "atom.io/json"

import type { Molecule, ReadableState } from ".."
import { newest } from "../lineage"
import type { Transceiver } from "../mutable"
import { deposit, type Store } from "../store"

export function seekInStore<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
	Key extends K,
>(
	token: MutableAtomFamilyToken<T, J, K>,
	key: Key,
	store: Store,
): MutableAtomToken<T, J> | undefined

export function seekInStore<T, K extends Json.Serializable, Key extends K>(
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
	store: Store,
): RegularAtomToken<T> | undefined

export function seekInStore<T, K extends Json.Serializable, Key extends K>(
	token: AtomFamilyToken<T, K>,
	key: Key,
	store: Store,
): AtomToken<T> | undefined

export function seekInStore<T, K extends Json.Serializable, Key extends K>(
	token: WritableSelectorFamilyToken<T, K>,
	key: Key,
	store: Store,
): WritableSelectorToken<T> | undefined

export function seekInStore<T, K extends Json.Serializable, Key extends K>(
	token: ReadonlySelectorFamilyToken<T, K>,
	key: Key,
	store: Store,
): ReadonlySelectorToken<T> | undefined

export function seekInStore<T, K extends Json.Serializable, Key extends K>(
	token: SelectorFamilyToken<T, K>,
	key: Key,
	store: Store,
): SelectorToken<T> | undefined

export function seekInStore<T, K extends Json.Serializable, Key extends K>(
	token: WritableFamilyToken<T, K>,
	key: Key,
	store: Store,
): WritableToken<T> | undefined

export function seekInStore<T, K extends Json.Serializable, Key extends K>(
	token: ReadableFamilyToken<T, K>,
	key: Key,
	store: Store,
): ReadableToken<T> | undefined

export function seekInStore<M extends MoleculeConstructor>(
	token: MoleculeFamilyToken<M>,
	key: MoleculeKey<M>,
	store: Store,
): MoleculeKey<M> | undefined

export function seekInStore(
	token: MoleculeFamilyToken<any> | ReadableFamilyToken<any, any>,
	key: Json.Serializable,
	store: Store,
): MoleculeToken<any> | ReadableToken<any> | undefined {
	const subKey = stringifyJson(key)
	const fullKey = `${token.key}(${subKey})`
	const target = newest(store)
	let state: Molecule<any> | ReadableState<any> | undefined
	switch (token.type) {
		case `atom_family`:
		case `mutable_atom_family`:
			state = target.atoms.get(fullKey)
			break
		case `selector_family`:
			state = target.selectors.get(fullKey)
			break
		case `readonly_selector_family`:
			state = target.readonlySelectors.get(fullKey)
			break
		case `molecule_family`:
			state = target.molecules.get(stringifyJson(key))
			if (state) {
				return deposit(state)
			}
	}
	if (state) {
		return deposit(state)
	}
	return state
}

export function composeSeekState(store: Store): typeof seekState {
	return function seek(...params: Parameters<typeof seekState>) {
		return seekInStore(...params, store)
	} as typeof seekState
}
