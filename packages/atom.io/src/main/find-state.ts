import type {
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlyPureSelectorFamilyToken,
	ReadonlyPureSelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	WritableFamilyToken,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
	WritableToken,
} from "atom.io"
import type { Transceiver } from "atom.io/internal"
import { findInStore, IMPLICIT } from "atom.io/internal"
import type { Canonical, Json } from "atom.io/json"

/**
 * @public
 * Finds a {@link MutableAtomToken} in the store
 * @param token - A {@link MutableAtomFamilyToken}
 * @param key - The key of the state
 * @returns
 * The current value of the state
 * @overload Mutable Atom
 */
export function findState<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
	Key extends K,
>(token: MutableAtomFamilyToken<T, J, K>, key: Key): MutableAtomToken<T, J, K>
/**
 * @public
 * Finds a state in the store
 * @param token - The token of the state family
 * @param key - The key of the state
 * @returns
 * The current value of the state
 * @overload Regular Atom
 */
export function findState<T, K extends Canonical, Key extends K>(
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
): RegularAtomToken<T, K>
/**
 * @public
 * Finds a state in the store
 * @param token - The token of the state family
 * @param key - The key of the state
 * @returns
 * The current value of the state
 * @overload Writable Selector
 */
export function findState<T, K extends Canonical, Key extends K>(
	token: WritablePureSelectorFamilyToken<T, K>,
	key: Key,
): WritablePureSelectorToken<T, K>
/**
 * @public
 * Finds a state in the store
 * @param token - The token of the state family
 * @param key - The key of the state
 * @returns
 * The current value of the state
 * @overload Readonly Selector
 */
export function findState<T, K extends Canonical, Key extends K>(
	token: ReadonlyPureSelectorFamilyToken<T, K>,
	key: Key,
): ReadonlyPureSelectorToken<T, K>
/**
 * @public
 * Finds a state in the store
 * @param token - The token of the state family
 * @param key - The key of the state
 * @returns
 * The current value of the state
 * @overload Writable State
 */
export function findState<T, K extends Canonical, Key extends K>(
	token: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T, K>
/**
 * @public
 * Finds a {@link ReadableToken} in the store
 * @param token - A {@link ReadableFamilyToken}
 * @param key - The key of the state
 * @returns
 * The current value of the state
 * @overload Unknown
 * @default
 */
export function findState<T, K extends Canonical, Key extends K>(
	token: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T, K>

export function findState(
	token: ReadableFamilyToken<any, any>,
	key: Json.Serializable,
): ReadableToken<any> {
	const state = findInStore(IMPLICIT.STORE, token, key)
	return state
}
