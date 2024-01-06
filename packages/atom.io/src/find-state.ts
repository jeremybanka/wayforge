import type {
	AtomFamilyToken,
	AtomToken,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	SelectorFamilyToken,
	SelectorToken,
	WritableFamilyToken,
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
>(token: MutableAtomFamilyToken<T, J, K>, key: K): MutableAtomToken<T, J>
export function findState<T, K extends Json.Serializable>(
	token: AtomFamilyToken<T, K>,
	key: K,
): AtomToken<T>
export function findState<T, K extends Json.Serializable>(
	token: SelectorFamilyToken<T, K>,
	key: K,
): SelectorToken<T>
export function findState<T, K extends Json.Serializable>(
	token: ReadonlySelectorFamilyToken<T, K>,
	key: K,
): ReadonlySelectorToken<T>
export function findState<T, K extends Json.Serializable>(
	token: WritableFamilyToken<T, K>,
	key: K,
): WritableToken<T>
export function findState<T, K extends Json.Serializable>(
	token: ReadableFamilyToken<T, K>,
	key: K,
): ReadableToken<T>
export function findState(
	token: ReadableFamilyToken<any, any>,
	key: Json.Serializable,
): ReadableToken<any> {
	const state = findInStore(token, key, IMPLICIT.STORE)
	return state
}
