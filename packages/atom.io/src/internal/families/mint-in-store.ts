import type { ReadableToken, WritableToken } from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { ReadableFamily } from ".."
import type { Store } from "../store"
import { COUNTERFEIT, mint } from "../store"

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
	const stringKey = stringifyJson(key)
	const molecule = store.molecules.get(stringKey)

	const cannotCreate = !molecule && store.config.lifespan === `immortal`

	if (cannotCreate) {
		store.logger.warn(
			`💣`,
			`key`,
			stringKey,
			`was used to mint a counterfeit token for`,
			family.type,
			`"${family.key}"`,
		)
		return mint(family, key, COUNTERFEIT)
	}

	if (mustCreate === MUST_CREATE) {
		family(key)
		if (molecule) {
			store.moleculeData.set(stringKey, family.key)
		}
	}

	return mint(family, key)
}
