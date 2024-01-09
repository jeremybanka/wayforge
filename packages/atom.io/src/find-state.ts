import type {
	AtomFamilyToken,
	AtomToken,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	WritableFamilyToken,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type { Store, Transceiver } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"
import type { Json } from "atom.io/json"

export function findInStore(
	token: ReadableFamilyToken<any, any>,
	key: Json.Serializable,
	store: Store,
): ReadableToken<any> {
	const familyKey = token.key
	const family = store.families.get(familyKey)
	if (family === undefined) {
		throw new Error(`Family ${familyKey} not found`)
	}
	const state = family(key)
	return state
}

export function findState<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
	Key extends K,
>(token: MutableAtomFamilyToken<T, J, K>, key: Key): MutableAtomToken<T, J>
export function findState<T, K extends Json.Serializable, Key extends K>(
	token: AtomFamilyToken<T, K>,
	key: Key,
): AtomToken<T>
export function findState<T, K extends Json.Serializable, Key extends K>(
	token: WritableSelectorFamilyToken<T, K>,
	key: Key,
): WritableSelectorToken<T>
export function findState<T, K extends Json.Serializable, Key extends K>(
	token: ReadonlySelectorFamilyToken<T, K>,
	key: Key,
): ReadonlySelectorToken<T>
export function findState<T, K extends Json.Serializable, Key extends K>(
	token: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T>
export function findState<T, K extends Json.Serializable, Key extends K>(
	token: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T>
export function findState(
	token: ReadableFamilyToken<any, any>,
	key: Json.Serializable,
): ReadableToken<any> {
	const state = findInStore(token, key, IMPLICIT.STORE)
	return state
}
