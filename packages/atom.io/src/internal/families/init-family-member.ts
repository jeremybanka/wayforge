import type {
	ReadableFamilyToken,
	ReadableToken,
	WritableFamilyToken,
	WritableToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import { newest } from "../lineage"
import type { Store } from "../store"
import { withdraw } from "../store"
import { isChildStore, isRootStore } from "../transaction"

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
	key: Canonical,
): ReadableToken<any> {
	const family = withdraw(store, token)
	const state = family(key)
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
			target.transactionMeta.update.subEvents.push({
				type: `state_creation`,
				token: state,
				timestamp: Date.now(),
			})
		}
	}
	return state
}
