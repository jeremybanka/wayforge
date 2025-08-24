import type {
	ReadableFamilyToken,
	ReadableToken,
	StateCreationEvent,
	WritableFamilyToken,
	WritableToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { ReadableFamily } from ".."
import { newest } from "../lineage"
import type { Store } from "../store"
import { COUNTERFEIT, mint } from "../store"
import { isChildStore, isRootStore } from "../transaction"
import { initFamilyMemberInStore } from "./init-family-member"

export const MUST_CREATE: unique symbol = Symbol(`MUST_CREATE`)

export function mintInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	family: ReadableFamily<T, K>,
	key: Key,
	mustCreate?: typeof MUST_CREATE,
): WritableToken<T, K>
export function mintInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	family: ReadableFamily<T, K>,
	key: Key,
	mustCreate?: typeof MUST_CREATE,
): ReadableToken<T, K>
export function mintInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	family: ReadableFamily<T, K>,
	key: Key,
	mustCreate?: typeof MUST_CREATE,
): ReadableToken<T, K> {
	let stateToken: ReadableToken<T, K>

	const willCreate = mustCreate === MUST_CREATE

	const stringKey = stringifyJson(key)
	const molecule = store.molecules.get(stringKey)
	if (!molecule && store.config.lifespan === `immortal`) {
		const fakeToken = mint(family, key, COUNTERFEIT)
		store.logger.warn(
			`💣`,
			`key`,
			stringKey,
			`was used to mint a counterfeit token for`,
			family.type,
			`"${family.key}"`,
		)
		return fakeToken
	}

	if (willCreate) {
		stateToken = family(key)
		const target = newest(store)
		const creationEvent = {
			type: `state_creation`,
			token: stateToken,
			timestamp: Date.now(),
		}
		if (isRootStore(target)) {
			family.subject.next(creationEvent)
			switch (stateToken.type) {
				case `atom`:
				case `mutable_atom`:
					store.on.atomCreation.next(stateToken)
					break
				case `writable_pure_selector`:
				case `readonly_pure_selector`:
				case `writable_held_selector`:
				case `readonly_held_selector`:
					store.on.selectorCreation.next(stateToken)
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
	} else {
		stateToken = mint(family, key)
	}
	return stateToken
}
