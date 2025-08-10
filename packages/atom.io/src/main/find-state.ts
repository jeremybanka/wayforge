import type {
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	RegularAtomToken,
	WritableFamilyToken,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type { Transceiver } from "atom.io/internal"
import { findInStore, IMPLICIT } from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type { MutableAtomFamilyToken, RegularAtomFamilyToken } from "./tokens"

/**
 * Finds a {@link MutableAtomToken} in the store, without accessing its value.
 *
 * In an ephemeral store, this will create a new atom if one does not exist with the given key.
 *
 * In an immortal store, a "counterfeit" atom token will be returned in this case and a warning will be logged.
 *
 * @param token - A {@link MutableAtomFamilyToken}
 * @param key - The key of the state
 * @returns
 * The current value of the state
 * @overload Mutable Atom
 */
export function findState<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
	Key extends K,
>(token: MutableAtomFamilyToken<T, K>, key: Key): MutableAtomToken<T, K>
/**
 * Finds a {@link RegularAtomToken} in the store, without accessing its value.
 *
 * In an ephemeral store, this will create a new atom if one does not exist with the given key.
 *
 * In an immortal store, a "counterfeit" atom token will be returned in this case and a warning will be logged.
 *
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
 * Finds a {@link WritableSelectorToken} in the store, without accessing its value.
 *
 * In an ephemeral store, this will create a new selector if one does not exist with the given key.
 *
 * In an immortal store, a "counterfeit" selector token will be returned in this case and a warning will be logged.
 *
 * @param token - The token of the state family
 * @param key - The key of the state
 * @returns
 * The current value of the state
 * @overload Writable Selector
 */
export function findState<T, K extends Canonical, Key extends K>(
	token: WritableSelectorFamilyToken<T, K>,
	key: Key,
): WritableSelectorToken<T, K>
/**
 * Finds a {@link ReadonlySelectorToken} in the store, without accessing its value.
 *
 * In an ephemeral store, this will create a new selector if one does not exist with the given key.
 *
 * In an immortal store, a "counterfeit" selector token will be returned in this case and a warning will be logged.
 *
 * @param token - The token of the state family
 * @param key - The key of the state
 * @returns
 * The current value of the state
 * @overload Readonly Selector
 */
export function findState<T, K extends Canonical, Key extends K>(
	token: ReadonlySelectorFamilyToken<T, K>,
	key: Key,
): ReadonlySelectorToken<T, K>
/**
 * Finds a {@link WritableToken} in the store, without accessing its value.
 *
 * In an ephemeral store, this will create a new atom or selector if one does not exist with the given key.
 *
 * In an immortal store, a "counterfeit" token will be returned in this case and a warning will be logged.
 *
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
 * Finds a {@link MutableAtomToken} in the store, without accessing its value.
 *
 * In an ephemeral store, this will create a new atom or selector if one does not exist with the given key.
 *
 * In an immortal store, a "counterfeit" token will be returned in this case and a warning will be logged.
 *
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
	key: Canonical,
): ReadableToken<any> {
	const state = findInStore(IMPLICIT.STORE, token, key)
	return state
}
