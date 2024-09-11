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

import { newest } from "../lineage"
import type { Transceiver } from "../mutable"
import { NotFoundError } from "../not-found-error"
import type { Store } from "../store"
import { isChildStore, isRootStore } from "../transaction"

export function initFamilyMemberInStore<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
	Key extends K,
>(
	store: Store,
	token: MutableAtomFamilyToken<T, J, K>,
	key: Key,
): MutableAtomToken<T, J, Key>

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
): RegularAtomToken<T, Key>

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: AtomFamilyToken<T, K>,
	key: Key,
): AtomToken<T, Key>

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: WritableSelectorFamilyToken<T, K>,
	key: Key,
): WritableSelectorToken<T, Key>

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: ReadonlySelectorFamilyToken<T, K>,
	key: Key,
): ReadonlySelectorToken<T, Key>

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: SelectorFamilyToken<T, K>,
	key: Key,
): SelectorToken<T, Key>

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T, Key>

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T, Key>

export function initFamilyMemberInStore(
	store: Store,
	token: ReadableFamilyToken<any, any>,
	key: Json.Serializable,
): ReadableToken<any> {
	const family = store.families.get(token.key)
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
