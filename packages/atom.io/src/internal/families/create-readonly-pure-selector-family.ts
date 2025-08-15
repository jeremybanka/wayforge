import type {
	FamilyMetadata,
	findState,
	getState,
	ReadonlyPureSelectorFamilyOptions,
	ReadonlyPureSelectorFamilyToken,
	ReadonlyPureSelectorToken,
	StateLifecycleEvent,
} from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import {
	findInStore,
	getFromStore,
	getJsonToken,
	prettyPrintTokenType,
	type ReadonlyPureSelectorFamily,
} from ".."
import { newest } from "../lineage"
import { createReadonlyPureSelector } from "../selector"
import type { Store } from "../store"
import { Subject } from "../subject"

export function createReadonlyPureSelectorFamily<T, K extends Canonical>(
	store: Store,
	options: ReadonlyPureSelectorFamilyOptions<T, K>,
	internalRoles?: string[],
): ReadonlyPureSelectorFamilyToken<T, K> {
	const familyKey = options.key
	const type = `readonly_pure_selector_family`

	const familyToken = {
		key: familyKey,
		type,
	} as const satisfies ReadonlyPureSelectorFamilyToken<T, K>

	const existing = store.families.get(familyKey)
	if (existing) {
		store.logger.error(
			`❗`,
			type,
			familyKey,
			`Overwriting an existing ${prettyPrintTokenType(
				existing,
			)} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}

	const subject = new Subject<
		StateLifecycleEvent<ReadonlyPureSelectorToken<T>>
	>()

	const familyFunction = (key: K): ReadonlyPureSelectorToken<T> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata = { key: familyKey, subKey }
		const fullKey = `${familyKey}(${subKey})`
		const target = newest(store)

		const token = createReadonlyPureSelector(
			target,
			{
				key: fullKey,
				get: options.get(key),
			},
			family,
		)

		subject.next({ type: `state_creation`, token, timestamp: Date.now() })
		return token
	}

	const readonlySelectorFamily = Object.assign(familyFunction, familyToken, {
		internalRoles,
		subject,
		install: (s: Store) => createReadonlyPureSelectorFamily(s, options),
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
	}) satisfies ReadonlyPureSelectorFamily<T, K>

	store.families.set(familyKey, readonlySelectorFamily)
	return familyToken
}
