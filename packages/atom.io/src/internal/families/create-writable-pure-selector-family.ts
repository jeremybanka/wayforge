import type {
	FamilyMetadata,
	findRelations,
	findState,
	getInternalRelations,
	getState,
	StateLifecycleEvent,
	WritablePureSelectorFamilyOptions,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorOptions,
	WritablePureSelectorToken,
} from "atom.io"
import { PRETTY_ENTITY_NAMES } from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { getFromStore } from "../get-state"
import { findRelationsInStore, getInternalRelationsFromStore } from "../join"
import { newest } from "../lineage"
import { getJsonToken } from "../mutable"
import { createWritablePureSelector } from "../selector"
import type { WritablePureSelectorFamily } from "../state-types"
import type { Store } from "../store"
import { Subject } from "../subject"
import type { RootStore } from "../transaction"
import { findInStore } from "./find-in-store"

export function createWritablePureSelectorFamily<T, K extends Canonical, E>(
	store: Store,
	options: WritablePureSelectorFamilyOptions<T, K, E>,
	internalRoles?: string[],
): WritablePureSelectorFamilyToken<T, K, E> {
	const familyKey = options.key
	const type = `writable_pure_selector_family`

	const familyToken = {
		key: familyKey,
		type,
	} as const satisfies WritablePureSelectorFamilyToken<T, K, E>

	const existing = store.families.get(familyKey)
	if (existing && store.config.isProduction === true) {
		store.logger.error(
			`❗`,
			type,
			familyKey,
			`Overwriting an existing ${PRETTY_ENTITY_NAMES[existing.type]} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}
	const subject = new Subject<
		StateLifecycleEvent<WritablePureSelectorToken<T, K, E>>
	>()

	const create = <Key extends K>(
		key: Key,
	): WritablePureSelectorToken<T, Key, E> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata<Key> = { key: familyKey, subKey }
		const fullKey = `${familyKey}(${subKey})`
		const target = newest(store)
		const individualOptions: WritablePureSelectorOptions<T, E> = {
			key: fullKey,
			get: options.get(key),
			set: options.set(key),
		}
		if (options.catch) {
			individualOptions.catch = options.catch
		}

		return createWritablePureSelector<T, Key, E>(
			target,
			individualOptions,
			family,
		)
	}

	const selectorFamily: WritablePureSelectorFamily<T, K, E> = {
		...familyToken,
		create,
		internalRoles,
		subject,
		install: (s: RootStore) => createWritablePureSelectorFamily(s, options),
		default: (key: K) => {
			const getFn = options.get(key)
			return getFn({
				get: ((...ps: Parameters<typeof getState>) =>
					getFromStore(store, ...ps)) as typeof getState,
				find: ((...ps: Parameters<typeof findState>) =>
					findInStore(store, ...ps)) as typeof findState,
				json: (token) => getJsonToken(store, token),
				rel: {
					find: ((...ps: Parameters<typeof findRelations>) =>
						findRelationsInStore(store, ...ps)) as typeof findRelations,
					internal: ((...ps: Parameters<typeof getInternalRelations>) =>
						getInternalRelationsFromStore(
							store,
							...ps,
						)) as typeof getInternalRelations,
				},
			})
		},
	}

	store.families.set(familyKey, selectorFamily)
	return familyToken
}
