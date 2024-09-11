import type {
	AtomFamilyToken,
	AtomToken,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorFamilyToken,
	SelectorToken,
	WritableFamilyToken,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import { type Canonical, type Json, stringifyJson } from "atom.io/json"

import { growMoleculeInStore } from "../molecule"
import type { Transceiver } from "../mutable"
import { counterfeit, type Store } from "../store"
import { initFamilyMemberInStore } from "./init-family-member"
import { seekInStore } from "./seek-in-store"

export function findInStore<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
	Key extends K,
>(
	store: Store,
	token: MutableAtomFamilyToken<T, J, K>,
	key: Key,
): MutableAtomToken<T, J, Key>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
): RegularAtomToken<T, Key>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: AtomFamilyToken<T, K>,
	key: Key,
): AtomToken<T, Key>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: WritableSelectorFamilyToken<T, K>,
	key: Key,
): WritableSelectorToken<T, Key>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: ReadonlySelectorFamilyToken<T, K>,
	key: Key,
): ReadonlySelectorToken<T, Key>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: SelectorFamilyToken<T, K>,
	key: Key,
): SelectorToken<T, Key>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T, Key>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T, Key>

export function findInStore(
	store: Store,
	token: ReadableFamilyToken<any, any>,
	key: Json.Serializable,
): ReadableToken<any> {
	let state = seekInStore(store, token, key)
	if (state) {
		return state
	}
	const molecule = store.molecules.get(stringifyJson(key))
	if (molecule) {
		return growMoleculeInStore(molecule, token, store)
	}
	if (store.config.lifespan === `immortal`) {
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
	return state
}
