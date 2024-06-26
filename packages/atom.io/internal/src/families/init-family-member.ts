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
import type { Json } from "atom.io/json"

import { newest } from "../lineage"
import type { Transceiver } from "../mutable"
import { NotFoundError } from "../not-found-error"
import type { Store } from "../store"
import { isChildStore, isRootStore } from "../transaction"

export function initFamilyMemberInStore<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
	Key extends K,
>(
	token: MutableAtomFamilyToken<T, J, K>,
	key: Key,
	store: Store,
): MutableAtomToken<T, J>

export function initFamilyMemberInStore<
	T,
	K extends Json.Serializable,
	Key extends K,
>(
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
	store: Store,
): RegularAtomToken<T>

export function initFamilyMemberInStore<
	T,
	K extends Json.Serializable,
	Key extends K,
>(token: AtomFamilyToken<T, K>, key: Key, store: Store): AtomToken<T>

export function initFamilyMemberInStore<
	T,
	K extends Json.Serializable,
	Key extends K,
>(
	token: WritableSelectorFamilyToken<T, K>,
	key: Key,
	store: Store,
): WritableSelectorToken<T>

export function initFamilyMemberInStore<
	T,
	K extends Json.Serializable,
	Key extends K,
>(
	token: ReadonlySelectorFamilyToken<T, K>,
	key: Key,
	store: Store,
): ReadonlySelectorToken<T>

export function initFamilyMemberInStore<
	T,
	K extends Json.Serializable,
	Key extends K,
>(token: SelectorFamilyToken<T, K>, key: Key, store: Store): SelectorToken<T>

export function initFamilyMemberInStore<
	T,
	K extends Json.Serializable,
	Key extends K,
>(token: WritableFamilyToken<T, K>, key: Key, store: Store): WritableToken<T>

export function initFamilyMemberInStore<
	T,
	K extends Json.Serializable,
	Key extends K,
>(token: ReadableFamilyToken<T, K>, key: Key, store: Store): ReadableToken<T>

export function initFamilyMemberInStore(
	token: ReadableFamilyToken<any, any>,
	key: Json.Serializable,
	store: Store,
): ReadableToken<any> {
	const familyKey = token.key
	const family = store.families.get(familyKey)
	if (family === undefined) {
		throw new NotFoundError(token, store)
	}
	const state = family(key)
	const target = newest(store)
	if (state.family && target.moleculeInProgress === null) {
		if (isRootStore(target)) {
			switch (state.type) {
				case `atom`:
				case `mutable_atom`:
					store.on.atomCreation.next(state)
					break
				case `selector`:
				case `readonly_selector`:
					store.on.selectorCreation.next(state)
					break
			}
		} else if (
			isChildStore(target) &&
			target.on.transactionApplying.state === null
		) {
			target.transactionMeta.update.updates.push({
				type: `state_creation`,
				token: state,
			})
		}
	}
	return state
}
