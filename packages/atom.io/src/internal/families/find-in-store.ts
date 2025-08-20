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

import type { Transceiver } from "../mutable"
import type { Store } from "../store"
import { mintInStore } from "./mint-in-store"
import { seekInStore } from "./seek-in-store"

// seek [token 🟧] [inits ⬛]
// find [token ✅] [inits ⬛]
// mint [token ✅] [inits 🟧]
// init [token ✅] [inits ✅]

export function findInStore<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
	Key extends K,
>(
	store: Store,
	familyToken: MutableAtomFamilyToken<T, K>,
	key: Key,
): MutableAtomToken<T, K>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: RegularAtomFamilyToken<T, K>,
	key: Key,
): RegularAtomToken<T, K>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: AtomFamilyToken<T, K>,
	key: Key,
): AtomToken<T, K>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: WritablePureSelectorFamilyToken<T, K>,
	key: Key,
): WritablePureSelectorToken<T, K>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: ReadonlyPureSelectorFamilyToken<T, K>,
	key: Key,
): ReadonlyPureSelectorToken<T, K>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: SelectorFamilyToken<T, K>,
	key: Key,
): SelectorToken<T, K>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T, K>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T, K>

export function findInStore(
	store: Store,
	familyToken: ReadableFamilyToken<any, any>,
	key: Canonical,
): ReadableToken<any> {
	const existingStateToken = seekInStore(store, familyToken, key)
	if (existingStateToken) {
		return existingStateToken
	}
	const newStateToken = mintInStore(store, familyToken, key)
	return newStateToken
}
