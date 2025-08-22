import type {
	FamilyMetadata,
	findState,
	getState,
	SelectorCreationEvent,
	SelectorDisposalEvent,
	WritablePureSelectorFamilyOptions,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
} from "atom.io"
import { PRETTY_TOKEN_TYPES } from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import {
	findInStore,
	getFromStore,
	getJsonToken,
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
	const familyKey = options.key
	const type = `writable_pure_selector_family`

	const familyToken = {
		key: familyKey,
		type,
	} as const satisfies WritablePureSelectorFamilyToken<T, K>

	const existing = store.families.get(familyKey)
	if (existing) {
		store.logger.error(
			`❗`,
			type,
			familyKey,
			`Overwriting an existing ${PRETTY_TOKEN_TYPES[existing.type]} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}
	const onCreation = new Subject<
		SelectorCreationEvent<WritablePureSelectorToken<T>>
	>()
	const onDisposal = new Subject<
		SelectorDisposalEvent<WritablePureSelectorToken<T>>
	>()

	const create = (key: K): WritablePureSelectorToken<T> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata = { key: familyKey, subKey }
		const fullKey = `${familyKey}(${subKey})`
		const target = newest(store)

		return createWritablePureSelector(
			target,
			{
				key: fullKey,
				get: options.get(key),
				set: options.set(key),
			},
			family,
		)
	}

	const selectorFamily = {
		...familyToken,
		create,
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
		install: (s: Store) => createWritablePureSelectorFamily(s, options),
		internalRoles,
		onCreation,
		onDisposal,
	} satisfies WritablePureSelectorFamily<T, K>

	store.families.set(familyKey, selectorFamily)
	return familyToken
}
