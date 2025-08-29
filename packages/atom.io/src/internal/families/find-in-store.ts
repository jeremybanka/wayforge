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
import { type Store, withdraw } from "../store"
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

export function findInStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	familyToken: RegularAtomFamilyToken<T, K, E>,
	key: Key,
): RegularAtomToken<T, K, E>

export function findInStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	familyToken: AtomFamilyToken<T, K, E>,
	key: Key,
): AtomToken<T, K, E>

export function findInStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	familyToken: WritablePureSelectorFamilyToken<T, K, E>,
	key: Key,
): WritablePureSelectorToken<T, K, E>

export function findInStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	familyToken: ReadonlyPureSelectorFamilyToken<T, K, E>,
	key: Key,
): ReadonlyPureSelectorToken<T, K, E>

export function findInStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	familyToken: SelectorFamilyToken<T, K, E>,
	key: Key,
): SelectorToken<T, K, E>

export function findInStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	familyToken: WritableFamilyToken<T, K, E>,
	key: Key,
): WritableToken<T, K, E>

export function findInStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	familyToken: ReadableFamilyToken<T, K, E>,
	key: Key,
): ReadableToken<T, K, E>

export function findInStore(
	store: Store,
	familyToken: ReadableFamilyToken<any, any, any>,
	key: Canonical,
): ReadableToken<any, any, any> {
	const family = withdraw(store, familyToken)
	const existingStateToken = seekInStore(store, familyToken, key)
	if (existingStateToken) {
		return existingStateToken
	}
	const newStateToken = mintInStore(store, family, key)
	return newStateToken
}
