import type {
	ReadableFamilyToken,
	ReadableToken,
	WritableFamilyToken,
	WritableToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { newest } from "../lineage"
import type { Store } from "../store"
import { COUNTERFEIT, mint } from "../store"
import { isChildStore, isRootStore } from "../transaction"
import { initFamilyMemberInStore } from "./init-family-member"
import { seekInStore } from "./seek-in-store"

export const DOES_NOT_EXIST: unique symbol = Symbol(`MUST_NOT_EXIST`)

export function mintInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: WritableFamilyToken<T, K>,
	key: Key,
	doesNotExist?: typeof DOES_NOT_EXIST,
): WritableToken<T, K>
export function mintInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: ReadableFamilyToken<T, K>,
	key: Key,
	doesNotExist?: typeof DOES_NOT_EXIST,
): ReadableToken<T, K>
export function mintInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: ReadableFamilyToken<T, K>,
	key: Key,
	doesNotExist?: typeof DOES_NOT_EXIST,
): ReadableToken<T, K> {
	let exists: boolean
	if (doesNotExist) {
		exists = false
	} else {
		exists = Boolean(seekInStore(store, familyToken, key))
	}

	const stringKey = stringifyJson(key)
	const molecule = store.molecules.get(stringKey)
	if (!molecule && store.config.lifespan === `immortal`) {
		const fakeToken = mint(familyToken, key, COUNTERFEIT)
		store.logger.warn(
			`💣`,
			`key`,
			stringKey,
			`was used to mint a counterfeit token for`,
			familyToken.type,
			`"${familyToken.key}"`,
		)
		return fakeToken
	}

	let newStateToken: ReadableToken<T, K>
	if (exists) {
		newStateToken = mint(familyToken, key)
	} else {
		newStateToken = initFamilyMemberInStore(store, familyToken, key)
	}
	const target = newest(store)
	if (newStateToken.family) {
		if (isRootStore(target)) {
			switch (newStateToken.type) {
				case `atom`:
				case `mutable_atom`:
					store.on.atomCreation.next(newStateToken)
					break
				case `writable_pure_selector`:
				case `readonly_pure_selector`:
				case `writable_held_selector`:
				case `readonly_held_selector`:
					store.on.selectorCreation.next(newStateToken)
					break
			}
		} else if (
			isChildStore(target) &&
			target.on.transactionApplying.state === null
		) {
			target.transactionMeta.update.subEvents.push({
				type: `state_creation`,
				token: newStateToken,
				timestamp: Date.now(),
			})
		}
	}
	if (molecule) {
		target.moleculeData.set(stringKey, familyToken.key)
	}
	return newStateToken
}
