import type {
	ReadableFamilyToken,
	ReadableToken,
	WritableFamilyToken,
	WritableToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import type { Store } from "../store"
import { withdraw } from "../store"

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T, K>

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T, K>

export function initFamilyMemberInStore(
	store: Store,
	token: ReadableFamilyToken<any, any>,
	key: Canonical,
): ReadableToken<any> {
	const family = withdraw(store, token)
	const state = family(key)

	return state
}
