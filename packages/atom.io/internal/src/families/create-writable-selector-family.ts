import type {
	FamilyMetadata,
	getState,
	StateCreation,
	StateDisposal,
	WritableSelectorFamilyOptions,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
} from "atom.io"
import type { findState } from "atom.io/ephemeral"
import type { seekState } from "atom.io/immortal"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import {
	findInStore,
	getFromStore,
	getJsonToken,
	prettyPrintTokenType,
	seekInStore,
	type WritableSelectorFamily,
} from ".."
import { newest } from "../lineage"
import { createWritableSelector } from "../selector"
import type { Store } from "../store"
import { Subject } from "../subject"

export function createWritableSelectorFamily<T, K extends Canonical>(
	store: Store,
	options: WritableSelectorFamilyOptions<T, K>,
	internalRoles?: string[],
): WritableSelectorFamilyToken<T, K> {
	const familyToken = {
		key: options.key,
		type: `selector_family`,
	} as const satisfies WritableSelectorFamilyToken<T, K>

	const existing = store.families.get(options.key)
	if (existing) {
		store.logger.error(
			`❗`,
			`selector_family`,
			options.key,
			`Overwriting an existing ${prettyPrintTokenType(
				existing,
			)} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}
	const subject = new Subject<
		| StateCreation<WritableSelectorToken<T>>
		| StateDisposal<WritableSelectorToken<T>>
	>()

	const familyFunction = (key: K): WritableSelectorToken<T> => {
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
		install: (s: Store) => createWritableSelectorFamily(s, options),
		default: (key: K) => {
			const getFn = options.get(key)
			return getFn({
				get: ((...ps: [any]) => getFromStore(store, ...ps)) as typeof getState,
				find: ((token, k) => findInStore(store, token, k)) as typeof findState,
				seek: ((token, k) => seekInStore(store, token, k)) as typeof seekState,
				json: (token) => getJsonToken(store, token),
				env: () => ({ store }),
			})
		},
	}) satisfies WritableSelectorFamily<T, K>

	store.families.set(options.key, selectorFamily)
	return familyToken
}
