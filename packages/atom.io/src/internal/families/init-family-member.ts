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
	StateCreation,
	WritableFamilyToken,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
	WritableToken,
} from "atom.io"
import type { Canonical, Json } from "atom.io/json"

import type { ReadableFamily } from ".."
import { readOrComputeValue } from "../get-state"
import { newest } from "../lineage"
import type { Transceiver } from "../mutable"
import { NotFoundError } from "../not-found-error"
import type { Store } from "../store"
import type { Subject } from "../subject"
import { isChildStore, isRootStore } from "../transaction"

export function initFamilyMemberInStore<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
	Key extends K,
>(
	store: Store,
	token: MutableAtomFamilyToken<T, K>,
	key: Key,
): MutableAtomToken<T, K>

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
): RegularAtomToken<T, K>

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: AtomFamilyToken<T, K>,
	key: Key,
): AtomToken<T, K>

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: WritablePureSelectorFamilyToken<T, K>,
	key: Key,
): WritablePureSelectorToken<T, K>

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: ReadonlyPureSelectorFamilyToken<T, K>,
	key: Key,
): ReadonlyPureSelectorToken<T, K>

export function initFamilyMemberInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	token: SelectorFamilyToken<T, K>,
	key: Key,
): SelectorToken<T, K>

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
	key: Json.Serializable,
): ReadableToken<any> {
	const family = store.families.get(token.key)
	if (family === undefined) {
		throw new NotFoundError(token, store)
	}

	const state = family(key)
	emitStateCreation(store, family, state)
	return state
}

export function emitStateCreation(
	store: Store,
	family: ReadableFamily<any, any>,
	state: ReadableToken<any>,
): void {
	const stateCreation: StateCreation<any> = {
		type: `state_creation`,
		token: state,
	}
	const subject = family.subject as Subject<StateCreation<any>>
	subject.next(stateCreation)
	const target = newest(store)
	if (state.family) {
		if (isRootStore(target)) {
			switch (state.type) {
				case `atom`:
				case `mutable_atom`:
					store.on.atomCreation.next(state)
					break
				case `writable_pure_selector`:
				case `readonly_pure_selector`:
				case `writable_held_selector`:
				case `readonly_held_selector`:
					store.on.selectorCreation.next(state)
					break
			}
		} else if (
			isChildStore(target) &&
			target.on.transactionApplying.state === null
		) {
			// target.transactionMeta.update.updates.push(stateCreation)
		}
	}
}
