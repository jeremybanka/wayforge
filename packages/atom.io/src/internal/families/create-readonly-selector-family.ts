import type {
	FamilyMetadata,
	findState,
	getState,
	ReadonlyTransientSelectorFamilyOptions,
	ReadonlyTransientSelectorFamilyToken,
	ReadonlyTransientSelectorToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import {
	findInStore,
	getFromStore,
	getJsonToken,
	prettyPrintTokenType,
	type ReadonlyTransientSelectorFamily,
} from ".."
import { newest } from "../lineage"
import { createReadonlySelector } from "../selector"
import type { Store } from "../store"
import { Subject } from "../subject"

export function createReadonlyTransientSelectorFamily<T, K extends Canonical>(
	store: Store,
	options: ReadonlyTransientSelectorFamilyOptions<T, K>,
	internalRoles?: string[],
): ReadonlyTransientSelectorFamilyToken<T, K> {
	const familyToken = {
		key: options.key,
		type: `readonly_transient_selector_family`,
	} as const satisfies ReadonlyTransientSelectorFamilyToken<T, K>

	const existing = store.families.get(options.key)
	if (existing) {
		store.logger.error(
			`❗`,
			`readonly_transient_selector_family`,
			options.key,
			`Overwriting an existing ${prettyPrintTokenType(
				existing,
			)} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}

	const subject = new Subject<
		| StateCreation<ReadonlyTransientSelectorToken<T>>
		| StateDisposal<ReadonlyTransientSelectorToken<T>>
	>()

	const familyFunction = (key: K): ReadonlyTransientSelectorToken<T> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata = { key: options.key, subKey }
		const fullKey = `${options.key}(${subKey})`
		const target = newest(store)

		const token = createReadonlySelector(
			target,
			{
				key: fullKey,
				get: options.get(key),
			},
			family,
		)

		subject.next({ type: `state_creation`, token })
		return token
	}

	const readonlySelectorFamily = Object.assign(familyFunction, familyToken, {
		internalRoles,
		subject,
		install: (s: Store) => createReadonlyTransientSelectorFamily(s, options),
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
	}) satisfies ReadonlyTransientSelectorFamily<T, K>

	store.families.set(options.key, readonlySelectorFamily)
	return familyToken
}
