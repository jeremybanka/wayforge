import type {
	ReadableFamilyToken,
	ReadableToken,
	StateCreationEvent,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import { isChildStore, isRootStore, type ReadableFamily, type Subject } from ".."
import { type Store, withdraw } from "../store"
import { getFallback } from "./get-fallback"
import { readOrComputeValue } from "./read-or-compute-value"
import { reduceReference } from "./reduce-reference"

export function getFromStore<T>(store: Store, token: ReadableToken<T>): T

export function getFromStore<T, K extends Canonical>(
	store: Store,
	token: ReadableFamilyToken<T, K>,
	key: K,
): T

export function getFromStore(
	store: Store,
	...params:
		| [token: ReadableFamilyToken<any, any>, key: Canonical]
		| [token: ReadableToken<any>]
): any {
	const { token, familyToken, subKey, isNew } = reduceReference(store, ...params)
	let family: ReadableFamily<any, any>

	if (`counterfeit` in token && familyToken && subKey) {
		family = withdraw(store, familyToken)
		return getFallback(store, token, family, subKey)
	}
	const state = withdraw(store, token)
	const value = readOrComputeValue(store, state)

	if (isNew && familyToken) {
		family ??= withdraw(store, familyToken)
		const onCreation = family.onCreation as Subject<StateCreationEvent>
		const timestamp = Date.now()
		let creationEvent: StateCreationEvent
		switch (family.type) {
			case `atom_family`:
			case `mutable_atom_family`:
				creationEvent = {
					type: `state_creation`,
					subType: `atom`,
					token,
					value,
					timestamp,
				}
				break
			case `readonly_held_selector_family`:
			case `readonly_pure_selector_family`:
			case `writable_held_selector_family`:
			case `writable_pure_selector_family`:
				creationEvent = {
					type: `state_creation`,
					subType: `selector`,
					token,
					timestamp,
					subEvents: [],
				}
		}
		onCreation.next(creationEvent)
		if (isRootStore(store)) {
			switch (token.type) {
				case `atom`:
				case `mutable_atom`:
					store.on.atomCreation.next(token)
					break
				case `writable_pure_selector`:
				case `readonly_pure_selector`:
				case `writable_held_selector`:
				case `readonly_held_selector`:
					store.on.selectorCreation.next(token)
					break
			}
		} else if (
			isChildStore(store) &&
			store.on.transactionApplying.state === null
		) {
			store.transactionMeta.update.subEvents.push(creationEvent)
		}
	}

	return value
}
