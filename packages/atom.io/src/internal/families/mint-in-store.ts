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
import { counterfeit } from "../store"
import { initFamilyMemberInStore } from "./init-family-member"

export function mintInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T, K>
export function mintInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T, K>
export function mintInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	familyToken: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T, K> {
	const stringKey = stringifyJson(key)
	const molecule = store.molecules.get(stringKey)
	if (!molecule && store.config.lifespan === `immortal`) {
		const fakeToken = counterfeit(familyToken, key)
		store.logger.error(
			`❌`,
			fakeToken.type,
			fakeToken.key,
			`was not found in store "${store.config.name}"; returned a counterfeit token.`,
		)
		return fakeToken
	}
	const newStateToken = initFamilyMemberInStore(store, familyToken, key)
	if (molecule) {
		const target = newest(store)
		target.moleculeData.set(stringKey, familyToken.key)
	}
	return newStateToken
}
