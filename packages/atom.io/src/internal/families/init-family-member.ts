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
	familyToken: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T, K>

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T, K>

export function initFamilyMemberInStore(
	store: Store,
	familyToken: ReadableFamilyToken<any, any>,
	key: Canonical,
): ReadableToken<any> {
	const family = withdraw(store, familyToken)
	const stateToken = family.create(key)

	return stateToken
}
