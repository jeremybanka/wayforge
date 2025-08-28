import type {
	FamilyMetadata,
	findState,
	getState,
	ReadonlyPureSelectorFamilyOptions,
	ReadonlyPureSelectorFamilyToken,
	ReadonlyPureSelectorToken,
	StateLifecycleEvent,
} from "atom.io"
import { PRETTY_TOKEN_TYPES } from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { ReadonlyPureSelectorFamily, RootStore } from ".."
import { findInStore, getFromStore, getJsonToken } from ".."
import { newest } from "../lineage"
import { createReadonlyPureSelector } from "../selector"
import { Subject } from "../subject"

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
	if (existing) {
		store.logger.error(
			`❗`,
			type,
			familyKey,
			`Overwriting an existing ${PRETTY_TOKEN_TYPES[existing.type]} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}

	const subject = new Subject<
		StateLifecycleEvent<ReadonlyPureSelectorToken<T, K, E>>
	>()

	const familyFunction = <Key extends K>(
		key: Key,
	): ReadonlyPureSelectorToken<T, Key, E> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata<Key> = { key: familyKey, subKey }
		const fullKey = `${familyKey}(${subKey})`
		const target = newest(store)

		const token = createReadonlyPureSelector<T, Key, E>(
			target,
			{
				key: fullKey,
				get: options.get(key),
			},
			family,
		)

		return token
	}

	const readonlySelectorFamily = Object.assign(familyFunction, familyToken, {
		internalRoles,
		catch: options.catch,
		subject,
		install: (s: RootStore) => createReadonlyPureSelectorFamily(s, options),
		default: (key: K) => {
			const getFn = options.get(key)
			return getFn({
				get: ((...args: Parameters<typeof getState>) =>
					getFromStore(store, ...args)) as typeof getState,
				find: ((...args: Parameters<typeof findState>) =>
					findInStore(store, ...args)) as typeof findState,
				json: (token) => getJsonToken(store, token),
			})
		},
	}) satisfies ReadonlyPureSelectorFamily<T, K, E>

	store.families.set(familyKey, readonlySelectorFamily)
	return familyToken
}
