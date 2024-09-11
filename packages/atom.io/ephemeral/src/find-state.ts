import type {
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	WritableFamilyToken,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type { Transceiver } from "atom.io/internal"
import { findInStore, IMPLICIT } from "atom.io/internal"
import type { Canonical, Json } from "atom.io/json"

/**
 * @overload Mutable Atom
 * Finds a {@link MutableAtomToken} in the store.
 * @param token - A {@link MutableAtomFamilyToken}.
 * @param key - The key of the state.
 * @returns
 * The current value of the state.
 */
export function findState<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
	Key extends K,
>(token: MutableAtomFamilyToken<T, J, K>, key: Key): MutableAtomToken<T, J, K>
/**
 * Finds a state in the store.
 * @param token - The token of the state family.
 * @param key - The key of the state.
 * @returns
 * The current value of the state.
 */
export function findState<T, K extends Canonical, Key extends K>(
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
): RegularAtomToken<T, Key>
/**
 * Finds a state in the store.
 * @param token - The token of the state family.
 * @param key - The key of the state.
 * @returns
 * The current value of the state.
 */
export function findState<T, K extends Canonical, Key extends K>(
	token: WritableSelectorFamilyToken<T, K>,
	key: Key,
): WritableSelectorToken<T, Key>
/**
 * Finds a state in the store.
 * @param token - The token of the state family.
 * @param key - The key of the state.
 * @returns
 * The current value of the state.
 */
export function findState<T, K extends Canonical, Key extends K>(
	token: ReadonlySelectorFamilyToken<T, K>,
	key: Key,
): ReadonlySelectorToken<T, Key>
/**
 * Finds a state in the store.
 * @param token - The token of the state family.
 * @param key - The key of the state.
 * @returns
 * The current value of the state.
 */
export function findState<T, K extends Canonical, Key extends K>(
	token: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T, Key>
/**
 * @public
 * Finds a {@link ReadableToken} in the store.
 * @param token - A {@link ReadableFamilyToken}.
 * @param key - The key of the state.
 * @returns
 * The current value of the state.
 * @overload Unknown
 */
export function findState<T, K extends Canonical, Key extends K>(
	token: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T, Key>

export function findState(
	token: ReadableFamilyToken<any, any>,
	key: Json.Serializable,
): ReadableToken<any> {
	const state = findInStore(IMPLICIT.STORE, token, key)
	return state
}
