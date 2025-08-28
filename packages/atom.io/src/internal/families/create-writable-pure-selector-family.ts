import type {
	FamilyMetadata,
	findState,
	getState,
	StateLifecycleEvent,
	WritablePureSelectorFamilyOptions,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
} from "atom.io"
import { PRETTY_TOKEN_TYPES } from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { RootStore, WritablePureSelectorFamily } from ".."
import { findInStore, getFromStore, getJsonToken } from ".."
import { newest } from "../lineage"
import { createWritablePureSelector } from "../selector"
import type { Store } from "../store"
import { Subject } from "../subject"

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
	if (existing) {
		store.logger.error(
			`❗`,
			type,
			familyKey,
			`Overwriting an existing ${PRETTY_TOKEN_TYPES[existing.type]} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}
	const subject = new Subject<
		StateLifecycleEvent<WritablePureSelectorToken<T, K, E>>
	>()

	const familyFunction = <Key extends K>(
		key: Key,
	): WritablePureSelectorToken<T, Key, E> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata<Key> = { key: familyKey, subKey }
		const fullKey = `${familyKey}(${subKey})`
		const target = newest(store)

		const token = createWritablePureSelector<T, Key, E>(
			target,
			{
				key: fullKey,
				get: options.get(key),
				set: options.set(key),
			},
			family,
		)

		// subject.next({ type: `state_creation`, token, timestamp: Date.now() })
		return token
	}

	const selectorFamily = Object.assign(familyFunction, familyToken, {
		internalRoles,
		subject,
		install: (s: RootStore) => createWritablePureSelectorFamily(s, options),
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
		...(options.catch ? { catch: options.catch } : {}),
	}) satisfies WritablePureSelectorFamily<T, K, E>

	store.families.set(familyKey, selectorFamily)
	return familyToken
}
