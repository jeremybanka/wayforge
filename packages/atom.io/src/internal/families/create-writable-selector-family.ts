import type {
	FamilyMetadata,
	findState,
	getState,
	StateCreation,
	StateDisposal,
	WritableTransientSelectorFamilyOptions,
	WritableTransientSelectorFamilyToken,
	WritableTransientSelectorToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import {
	findInStore,
	getFromStore,
	getJsonToken,
	prettyPrintTokenType,
	type WritableTransientSelectorFamily,
} from ".."
import { newest } from "../lineage"
import { createWritableSelector } from "../selector"
import type { Store } from "../store"
import { Subject } from "../subject"

export function createWritableTransientSelectorFamily<T, K extends Canonical>(
	store: Store,
	options: WritableTransientSelectorFamilyOptions<T, K>,
	internalRoles?: string[],
): WritableTransientSelectorFamilyToken<T, K> {
	const familyToken = {
		key: options.key,
		type: `writable_transient_selector_family`,
	} as const satisfies WritableTransientSelectorFamilyToken<T, K>

	const existing = store.families.get(options.key)
	if (existing) {
		store.logger.error(
			`❗`,
			`writable_transient_selector_family`,
			options.key,
			`Overwriting an existing ${prettyPrintTokenType(
				existing,
			)} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}
	const subject = new Subject<
		| StateCreation<WritableTransientSelectorToken<T>>
		| StateDisposal<WritableTransientSelectorToken<T>>
	>()

	const familyFunction = (key: K): WritableTransientSelectorToken<T> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata = { key: options.key, subKey }
		const fullKey = `${options.key}(${subKey})`
		const target = newest(store)

		const token = createWritableSelector(
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
		install: (s: Store) => createWritableTransientSelectorFamily(s, options),
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
	}) satisfies WritableTransientSelectorFamily<T, K>

	store.families.set(options.key, selectorFamily)
	return familyToken
}
