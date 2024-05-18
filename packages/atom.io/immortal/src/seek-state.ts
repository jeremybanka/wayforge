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
import { IMPLICIT } from "atom.io/internal"
import type { Json } from "atom.io/json"

import { seekInStore } from "../../internal/src/families/seek-in-store"

export function seekState<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
	Key extends K,
>(
	token: MutableAtomFamilyToken<T, J, K>,
	key: Key,
): MutableAtomToken<T, J> | undefined

export function seekState<T, K extends Json.Serializable, Key extends K>(
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
): RegularAtomToken<T> | undefined

export function seekState<T, K extends Json.Serializable, Key extends K>(
	token: WritableSelectorFamilyToken<T, K>,
	key: Key,
): WritableSelectorToken<T> | undefined

export function seekState<T, K extends Json.Serializable, Key extends K>(
	token: ReadonlySelectorFamilyToken<T, K>,
	key: Key,
): ReadonlySelectorToken<T> | undefined

export function seekState<T, K extends Json.Serializable, Key extends K>(
	token: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T> | undefined

export function seekState<T, K extends Json.Serializable, Key extends K>(
	token: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T> | undefined

export function seekState(
	token: ReadableFamilyToken<any, any>,
	key: Json.Serializable,
): ReadableToken<any> | undefined {
	const state = seekInStore(token, key, IMPLICIT.STORE)
	return state
}
