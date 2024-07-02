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
import type { findState } from "atom.io/ephemeral"
import type { Json } from "atom.io/json"

import type { Transceiver } from "../mutable"
import type { Store } from "../store"
import { initFamilyMemberInStore } from "./init-family-member"
import { seekInStore } from "./seek-in-store"

export function findInStore<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
	Key extends K,
>(
	token: MutableAtomFamilyToken<T, J, K>,
	key: Key,
	store: Store,
): MutableAtomToken<T, J>

export function findInStore<T, K extends Json.Serializable, Key extends K>(
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
	store: Store,
): RegularAtomToken<T>

export function findInStore<T, K extends Json.Serializable, Key extends K>(
	token: AtomFamilyToken<T, K>,
	key: Key,
	store: Store,
): AtomToken<T>

export function findInStore<T, K extends Json.Serializable, Key extends K>(
	token: WritableSelectorFamilyToken<T, K>,
	key: Key,
	store: Store,
): WritableSelectorToken<T>

export function findInStore<T, K extends Json.Serializable, Key extends K>(
	token: ReadonlySelectorFamilyToken<T, K>,
	key: Key,
	store: Store,
): ReadonlySelectorToken<T>

export function findInStore<T, K extends Json.Serializable, Key extends K>(
	token: SelectorFamilyToken<T, K>,
	key: Key,
	store: Store,
): SelectorToken<T>

export function findInStore<T, K extends Json.Serializable, Key extends K>(
	token: WritableFamilyToken<T, K>,
	key: Key,
	store: Store,
): WritableToken<T>

export function findInStore<T, K extends Json.Serializable, Key extends K>(
	token: ReadableFamilyToken<T, K>,
	key: Key,
	store: Store,
): ReadableToken<T>

export function findInStore(
	token: ReadableFamilyToken<any, any>,
	key: Json.Serializable,
	store: Store,
): ReadableToken<any> {
	if (store.config.lifespan === `immortal`) {
		throw new Error(
			`Do not use \`find\` or \`findState\` in an immortal store. Prefer \`seek\` or \`seekState\`.`,
		)
	}
	let state = seekInStore(token, key, store)
	if (state) {
		return state
	}
	state = initFamilyMemberInStore(token, key, store)
	return state
}

export function composeFindState(store: Store): typeof findState {
	return function find(...params: Parameters<typeof findState>) {
		return findInStore(...params, store)
	} as typeof findState
}
