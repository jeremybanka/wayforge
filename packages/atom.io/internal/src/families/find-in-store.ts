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
import type { Canonical, Json } from "atom.io/json"

import type { Transceiver } from "../mutable"
import type { Store } from "../store"
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
): MutableAtomToken<T, J>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
): RegularAtomToken<T>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: AtomFamilyToken<T, K>,
	key: Key,
): AtomToken<T>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: WritableSelectorFamilyToken<T, K>,
	key: Key,
): WritableSelectorToken<T>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: ReadonlySelectorFamilyToken<T, K>,
	key: Key,
): ReadonlySelectorToken<T>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: SelectorFamilyToken<T, K>,
	key: Key,
): SelectorToken<T>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T>

export function findInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T>

export function findInStore(
	store: Store,
	token: ReadableFamilyToken<any, any>,
	key: Json.Serializable,
): ReadableToken<any> {
	if (store.config.lifespan === `immortal`) {
		throw new Error(
			`Do not use \`find\` or \`findState\` in an immortal store. Prefer \`seek\` or \`seekState\`.`,
		)
	}
	let state = seekInStore(store, token, key)
	if (state) {
		return state
	}
	state = initFamilyMemberInStore(store, token, key)
	return state
}
