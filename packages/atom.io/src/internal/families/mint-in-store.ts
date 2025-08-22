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
import { initFamilyMemberInStore } from "./init-family-member"

export const MUST_CREATE: unique symbol = Symbol(`MUST_NOT_EXIST`)

export function mintInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: WritableFamilyToken<T, K>,
	key: Key,
	init?: typeof MUST_CREATE,
): WritableToken<T, K>
export function mintInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: ReadableFamilyToken<T, K>,
	key: Key,
	init?: typeof MUST_CREATE,
): ReadableToken<T, K>
export function mintInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: ReadableFamilyToken<T, K>,
	key: Key,
	shouldCreate?: typeof MUST_CREATE,
): ReadableToken<T, K> {
	let stateToken: ReadableToken<T, K>

	const willCreate = shouldCreate === MUST_CREATE

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

	if (willCreate) {
		stateToken = initFamilyMemberInStore(store, familyToken, key)
		const target = newest(store)
		if (molecule) {
			target.moleculeData.set(stringKey, familyToken.key)
		}
	} else {
		stateToken = mint(familyToken, key)
	}
	return stateToken
}
