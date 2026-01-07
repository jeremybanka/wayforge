import type {
	FamilyMetadata,
	findRelations,
	findState,
	getInternalRelations,
	getState,
	ReadonlyPureSelectorFamilyOptions,
	ReadonlyPureSelectorFamilyToken,
	ReadonlyPureSelectorOptions,
	ReadonlyPureSelectorToken,
	StateLifecycleEvent,
} from "atom.io"
import { PRETTY_ENTITY_NAMES } from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { getFromStore } from "../get-state"
import { findRelationsInStore, getInternalRelationsFromStore } from "../join"
import { newest } from "../lineage"
import { getJsonToken } from "../mutable"
import { createReadonlyPureSelector } from "../selector"
import type { ReadonlyPureSelectorFamily } from "../state-types"
import { Subject } from "../subject"
import type { RootStore } from "../transaction"
import { findInStore } from "./find-in-store"

export function createReadonlyPureSelectorFamily<T, K extends Canonical, E>(
	store: RootStore,
	options: ReadonlyPureSelectorFamilyOptions<T, K, E>,
	internalRoles?: string[],
): ReadonlyPureSelectorFamilyToken<T, K, E> {
	const familyKey = options.key
	const type = `readonly_pure_selector_family`

	const familyToken = {
		key: familyKey,
		type,
	} as const satisfies ReadonlyPureSelectorFamilyToken<T, K, E>

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
		StateLifecycleEvent<ReadonlyPureSelectorToken<T, K, E>>
	>()

	const create = <Key extends K>(
		key: Key,
	): ReadonlyPureSelectorToken<T, Key, E> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata<Key> = { key: familyKey, subKey }
		const fullKey = `${familyKey}(${subKey})`
		const target = newest(store)
		const individualOptions: ReadonlyPureSelectorOptions<T, E> = {
			key: fullKey,
			get: options.get(key),
		}
		if (options.catch) {
			individualOptions.catch = options.catch
		}

		return createReadonlyPureSelector<T, Key, E>(
			target,
			individualOptions,
			family,
		)
	}

	const readonlySelectorFamily: ReadonlyPureSelectorFamily<T, K, E> = {
		...familyToken,
		create,
		internalRoles,
		subject,
		install: (s: RootStore) => createReadonlyPureSelectorFamily(s, options),
		default: (key: K) => {
			const getFn = options.get(key)
			return getFn({
				get: getFromStore.bind(null, store) as typeof getState,
				find: findInStore.bind(null, store) as typeof findState,
				json: (token) => getJsonToken(store, token),
				rel: {
					find: findRelationsInStore.bind(null, store) as typeof findRelations,
					internal: getInternalRelationsFromStore.bind(
						null,
						store,
					) as typeof getInternalRelations,
				},
			})
		},
	}

	store.families.set(familyKey, readonlySelectorFamily)
	return familyToken
}
