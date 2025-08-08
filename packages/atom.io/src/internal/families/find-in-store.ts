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
import { type Canonical, type Json, stringifyJson } from "atom.io/json"

import { newest } from "../lineage"
import type { Transceiver } from "../mutable"
import { counterfeit, type Store } from "../store"
import { initFamilyMemberInStore } from "./init-family-member"
import { seekInStore } from "./seek-in-store"

export function findInStore<
	T extends Transceiver<any, any>,
	J extends Json.Serializable,
	K extends Canonical,
	Key extends K,
>(
	store: Store,
	token: MutableAtomFamilyToken<T, J, K>,
	key: Key,
): MutableAtomToken<T, K>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
): RegularAtomToken<T, K>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: AtomFamilyToken<T, K>,
	key: Key,
): AtomToken<T, K>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: WritablePureSelectorFamilyToken<T, K>,
	key: Key,
): WritablePureSelectorToken<T, K>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: ReadonlyPureSelectorFamilyToken<T, K>,
	key: Key,
): ReadonlyPureSelectorToken<T, K>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: SelectorFamilyToken<T, K>,
	key: Key,
): SelectorToken<T, K>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T, K>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T, K>

export function findInStore(
	store: Store,
	token: ReadableFamilyToken<any, any>,
	key: Canonical,
): ReadableToken<any> {
	let state = seekInStore(store, token, key)
	if (state) {
		return state
	}
	const stringKey = stringifyJson(key)
	const molecule = store.molecules.get(stringKey)
	if (!molecule && store.config.lifespan === `immortal`) {
		const fakeToken = counterfeit(token, key)
		store.logger.error(
			`❌`,
			fakeToken.type,
			fakeToken.key,
			`was not found in store "${store.config.name}"; returned a counterfeit token.`,
		)
		return fakeToken
	}
	state = initFamilyMemberInStore(store, token, key)
	if (molecule) {
		const target = newest(store)
		target.moleculeData.set(stringKey, token.key)
	}
	return state
}
