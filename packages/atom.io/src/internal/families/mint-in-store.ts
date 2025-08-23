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
	subKey: Key,
	mustCreate?: typeof MUST_CREATE,
): ReadableToken<T, K> {
	let stateToken: ReadableToken<T, K>

	const willCreate = mustCreate === MUST_CREATE

	const stringKey = stringifyJson(subKey)
	const molecule = store.molecules.get(stringKey)
	if (!molecule && store.config.lifespan === `immortal`) {
		const fakeToken = mint(family, subKey, COUNTERFEIT)
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
		stateToken = family(subKey)
	} else {
		stateToken = mint(family, subKey)
	}
	return stateToken
}
