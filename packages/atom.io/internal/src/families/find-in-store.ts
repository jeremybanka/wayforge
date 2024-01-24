import type { Json } from "atom.io/json"

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
import type { Transceiver } from "../mutable"
import { NotFoundError } from "../not-found-error"
import type { Store } from "../store"

export function findInStore<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
	Key extends K,
>(
	token: MutableAtomFamilyToken<T, J, K>,
	key: Key,
	store: Store,
): MutableAtomToken<T, J>

export function findInStore<T, K extends Json.Serializable, Key extends K>(
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
	store: Store,
): RegularAtomToken<T>

export function findInStore<T, K extends Json.Serializable, Key extends K>(
	token: AtomFamilyToken<T, K>,
	key: Key,
	store: Store,
): AtomToken<T>

export function findInStore<T, K extends Json.Serializable, Key extends K>(
	token: WritableSelectorFamilyToken<T, K>,
	key: Key,
	store: Store,
): WritableSelectorToken<T>

export function findInStore<T, K extends Json.Serializable, Key extends K>(
	token: ReadonlySelectorFamilyToken<T, K>,
	key: Key,
	store: Store,
): ReadonlySelectorToken<T>

export function findInStore<T, K extends Json.Serializable, Key extends K>(
	token: SelectorFamilyToken<T, K>,
	key: Key,
	store: Store,
): SelectorToken<T>

export function findInStore<T, K extends Json.Serializable, Key extends K>(
	token: WritableFamilyToken<T, K>,
	key: Key,
	store: Store,
): WritableToken<T>

export function findInStore<T, K extends Json.Serializable, Key extends K>(
	token: ReadableFamilyToken<T, K>,
	key: Key,
	store: Store,
): ReadableToken<T>

export function findInStore(
	token: ReadableFamilyToken<any, any>,
	key: Json.Serializable,
	store: Store,
): ReadableToken<any> {
	const familyKey = token.key
	const family = store.families.get(familyKey)
	if (family === undefined) {
		throw new NotFoundError(token, store)
	}
	const state = family(key)
	return state
}
