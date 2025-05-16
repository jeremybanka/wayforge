import type {
	FamilyMetadata,
	findState,
	getState,
	StateCreation,
	StateDisposal,
	WritablePureSelectorFamilyOptions,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import {
	findInStore,
	getFromStore,
	getJsonToken,
	prettyPrintTokenType,
	type WritablePureSelectorFamily,
} from ".."
import { newest } from "../lineage"
import { createWritablePureSelector } from "../selector"
import type { Store } from "../store"
import { Subject } from "../subject"

export function createWritablePureSelectorFamily<T, K extends Canonical>(
	store: Store,
	options: WritablePureSelectorFamilyOptions<T, K>,
	internalRoles?: string[],
): WritablePureSelectorFamilyToken<T, K> {
	const familyToken = {
		key: options.key,
		type: `writable_pure_selector_family`,
	} as const satisfies WritablePureSelectorFamilyToken<T, K>

	const existing = store.families.get(options.key)
	if (existing) {
		store.logger.error(
			`❗`,
			`writable_pure_selector_family`,
			options.key,
			`Overwriting an existing ${prettyPrintTokenType(
				existing,
			)} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}
	const subject = new Subject<
		| StateCreation<WritablePureSelectorToken<T>>
		| StateDisposal<WritablePureSelectorToken<T>>
	>()

	const familyFunction = (key: K): WritablePureSelectorToken<T> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata = { key: options.key, subKey }
		const fullKey = `${options.key}(${subKey})`
		const target = newest(store)

		const token = createWritablePureSelector(
			target,
			{
				key: fullKey,
				get: options.get(key),
				set: options.set(key),
			},
			family,
		)

		subject.next({ type: `state_creation`, token })
		return token
	}

	const selectorFamily = Object.assign(familyFunction, familyToken, {
		internalRoles,
		subject,
		install: (s: Store) => createWritablePureSelectorFamily(s, options),
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
	}) satisfies WritablePureSelectorFamily<T, K>

	store.families.set(options.key, selectorFamily)
	return familyToken
}
