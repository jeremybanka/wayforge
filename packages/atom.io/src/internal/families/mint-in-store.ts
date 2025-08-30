import type { ReadableToken, WritableToken } from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { ReadableFamily } from "../state-types"
import type { Store } from "../store"

export const FAMILY_MEMBER_TOKEN_TYPES = {
	atom_family: `atom`,
	molecule_family: `molecule`,
	mutable_atom_family: `mutable_atom`,
	readonly_held_selector_family: `readonly_held_selector`,
	readonly_pure_selector_family: `readonly_pure_selector`,
	writable_held_selector_family: `writable_held_selector`,
	writable_pure_selector_family: `writable_pure_selector`,
} as const

export const MUST_CREATE: unique symbol = Symbol(`MUST_CREATE`)
export const DO_NOT_CREATE: unique symbol = Symbol(`DO_NOT_CREATE`)

export function mintInStore<T, K extends Canonical, KK extends K, E>(
	mustCreate: typeof DO_NOT_CREATE | typeof MUST_CREATE,
	store: Store,
	family: ReadableFamily<T, K, E>,
	key: KK,
): WritableToken<T, KK, E>
export function mintInStore<T, K extends Canonical, KK extends K, E>(
	mustCreate: typeof DO_NOT_CREATE | typeof MUST_CREATE,
	store: Store,
	family: ReadableFamily<T, K, E>,
	key: KK,
): ReadableToken<T, KK, E>
export function mintInStore<T, K extends Canonical, KK extends K, E>(
	mustCreate: typeof DO_NOT_CREATE | typeof MUST_CREATE,
	store: Store,
	family: ReadableFamily<T, K, E>,
	key: KK,
): ReadableToken<T, KK, E> {
	const stringKey = stringifyJson(key)
	const molecule = store.molecules.get(stringKey)

	const cannotCreate = !molecule && store.config.lifespan === `immortal`

	if (cannotCreate) {
		const { type: familyType, key: familyKey } = family
		store.logger.warn(
			`💣`,
			`key`,
			stringKey,
			`was used to mint a counterfeit token for`,
			familyType,
			`"${familyKey}"`,
		)
		const fullKey = `${familyKey}(${stringKey})`
		const type = FAMILY_MEMBER_TOKEN_TYPES[familyType]
		const stateToken: ReadableToken<T, KK, E> & { counterfeit: true } = {
			counterfeit: true,
			key: fullKey,
			type,
			family: {
				key: familyKey,
				subKey: stringKey,
			},
		}

		return stateToken
	}

	let token: ReadableToken<T, KK, E>
	if (mustCreate === MUST_CREATE) {
		store.logger.info(
			`👪`,
			family.type,
			family.key,
			`adds member`,
			typeof key === `string` ? `\`${key}\`` : key,
		)
		token = family.create(key)
		if (molecule) {
			store.moleculeData.set(stringKey, family.key)
		}
	} else {
		const { type: familyType, key: familyKey } = family
		const fullKey = `${familyKey}(${stringKey})`
		const type = FAMILY_MEMBER_TOKEN_TYPES[familyType]
		const stateToken: ReadableToken<T, KK, E> = {
			key: fullKey,
			type,
			family: {
				key: familyKey,
				subKey: stringKey,
			},
		}

		return stateToken
	}

	return token
}
