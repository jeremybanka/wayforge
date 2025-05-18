import type {
	AtomFamilyToken,
	AtomToken,
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
import type { Canonical, Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { Molecule, ReadableState } from ".."
import { newest } from "../lineage"
import type { Transceiver } from "../mutable"
import { deposit, type Store } from "../store"

export function seekInStore<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
	Key extends K,
>(
	store: Store,
	token: MutableAtomFamilyToken<T, J, K>,
	key: Key,
): MutableAtomToken<T, J, K> | undefined

export function seekInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
): RegularAtomToken<T, K> | undefined

export function seekInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: AtomFamilyToken<T, K>,
	key: Key,
): AtomToken<T, K> | undefined

export function seekInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: WritableSelectorFamilyToken<T, K>,
	key: Key,
): WritableSelectorToken<T, K> | undefined

export function seekInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: ReadonlySelectorFamilyToken<T, K>,
	key: Key,
): ReadonlySelectorToken<T, K> | undefined

export function seekInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: SelectorFamilyToken<T, K>,
	key: Key,
): SelectorToken<T, K> | undefined

export function seekInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T, K> | undefined

export function seekInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T, K> | undefined

export function seekInStore(
	store: Store,
	token: ReadableFamilyToken<any, any>,
	key: Canonical,
): ReadableToken<any> | undefined {
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
			state = target.writableSelectors.get(fullKey)
			break
		case `readonly_selector_family`:
			state = target.readonlySelectors.get(fullKey)
			break
	}
	if (state) {
		return deposit(state)
	}
	return state
}
