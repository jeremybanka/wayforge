import type {
	FamilyMetadata,
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
	seekInStore,
	type WritableSelectorFamily,
} from ".."
import { newest } from "../lineage"
import { createWritableSelector } from "../selector"
import type { Store } from "../store"
import { Subject } from "../subject"
import { throwInCaseOfConflictingFamily } from "./throw-in-case-of-conflicting-family"

export function createWritableSelectorFamily<T, K extends Canonical>(
	options: WritableSelectorFamilyOptions<T, K>,
	store: Store,
	internalRoles?: string[],
): WritableSelectorFamilyToken<T, K> {
	const familyToken = {
		key: options.key,
		type: `selector_family`,
	} as const satisfies WritableSelectorFamilyToken<T, K>

	throwInCaseOfConflictingFamily(familyToken, store)

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
			{
				key: fullKey,
				get: options.get(key),
				set: options.set(key),
			},
			family,
			target,
		)

		subject.next({ type: `state_creation`, token })
		return token
	}

	const selectorFamily = Object.assign(familyFunction, familyToken, {
		internalRoles,
		subject,
		install: (s: Store) => createWritableSelectorFamily(options, s),
		default: (key: K) => {
			const getFn = options.get(key)
			return getFn({
				get: (token) => getFromStore(token, store),
				find: ((token, k) => findInStore(token, k, store)) as typeof findState,
				seek: ((token, k) => seekInStore(token, k, store)) as typeof seekState,
				json: (token) => getJsonToken(token, store),
			})
		},
	}) satisfies WritableSelectorFamily<T, K>

	store.families.set(options.key, selectorFamily)
	return familyToken
}
