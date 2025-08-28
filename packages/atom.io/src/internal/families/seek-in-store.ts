import type {
	AtomFamilyToken,
	AtomToken,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlyPureSelectorFamilyToken,
	ReadonlyPureSelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorFamilyToken,
	SelectorToken,
	WritableFamilyToken,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
	WritableToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { ReadableState } from ".."
import { newest } from "../lineage"
import type { Transceiver } from "../mutable"
import { deposit, type Store } from "../store"

export function seekInStore<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
	Key extends K,
>(
	store: Store,
	token: MutableAtomFamilyToken<T, K>,
	key: Key,
): MutableAtomToken<T, Key> | undefined

export function seekInStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	token: RegularAtomFamilyToken<T, K, E>,
	key: Key,
): RegularAtomToken<T, Key, E> | undefined

export function seekInStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	token: AtomFamilyToken<T, K, E>,
	key: Key,
): AtomToken<T, Key, E> | undefined

export function seekInStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	token: WritablePureSelectorFamilyToken<T, K, E>,
	key: Key,
): WritablePureSelectorToken<T, Key, E> | undefined

export function seekInStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	token: ReadonlyPureSelectorFamilyToken<T, K, E>,
	key: Key,
): ReadonlyPureSelectorToken<T, Key, E> | undefined

export function seekInStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	token: SelectorFamilyToken<T, K, E>,
	key: Key,
): SelectorToken<T, Key, E> | undefined

export function seekInStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	token: WritableFamilyToken<T, K, E>,
	key: Key,
): WritableToken<T, Key, E> | undefined

export function seekInStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	token: ReadableFamilyToken<T, K, E>,
	key: Key,
): ReadableToken<T, Key, E> | undefined

export function seekInStore(
	store: Store,
	token: ReadableFamilyToken<any, any, any>,
	key: Canonical,
): ReadableToken<any, any, any> | undefined {
	const subKey = stringifyJson(key)
	const fullKey = `${token.key}(${subKey})`
	const target = newest(store)
	let state: ReadableState<any, any> | undefined
	switch (token.type) {
		case `atom_family`:
		case `mutable_atom_family`:
			state = target.atoms.get(fullKey)
			break
		case `writable_held_selector_family`:
		case `writable_pure_selector_family`:
			state = target.writableSelectors.get(fullKey)
			break
		case `readonly_held_selector_family`:
		case `readonly_pure_selector_family`:
			state = target.readonlySelectors.get(fullKey)
			break
	}
	if (state) {
		return deposit(state)
	}
	return state
}
