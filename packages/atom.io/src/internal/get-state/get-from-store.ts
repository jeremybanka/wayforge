import type {
	ReadableFamilyToken,
	ReadableToken,
	StateCreationEvent,
} from "atom.io"
import { type Canonical, stringifyJson } from "atom.io/json"

import { getFamilyOfToken } from "../families/get-family-of-token"
import { newest } from "../lineage"
import { type Store, withdraw } from "../store"
import { isChildStore, isRootStore } from "../transaction"
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
	const { token, family, subKey, isNew } = reduceReference(store, ...params)

	if (`counterfeit` in token && family && subKey) {
		return getFallback(store, token, family, subKey)
	}
	const state = withdraw(store, token)

	const { family: familyMeta } = token
	// console.log({ isNew, family, familyMeta })
	if (isNew && family && familyMeta) {
		const target = newest(store)
		const creationEvent: StateCreationEvent<any> = {
			type: `state_creation`,
			token,
			timestamp: Date.now(),
		}
		const stringKey = stringifyJson(familyMeta.subKey)
		const molecule = target.molecules.get(stringKey)
		family.subject.next(creationEvent)
		if (isRootStore(target)) {
			switch (token.type) {
				case `atom`:
				case `mutable_atom`:
					target.on.atomCreation.next(token)
					break
				case `readonly_held_selector`:
				case `readonly_pure_selector`:
				case `writable_pure_selector`:
				case `writable_held_selector`:
					target.on.selectorCreation.next(token)
					break
			}
		} else if (
			isChildStore(target) &&
			target.on.transactionApplying.state === null
		) {
			target.transactionMeta.update.subEvents.push(creationEvent)
		}
		if (molecule) {
			target.moleculeData.set(stringKey, family.key)
		}
	}
	return readOrComputeValue(store, state)
}
