import type {
	FamilyMetadata,
	getState,
	ReadonlySelectorFamilyOptions,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import type { findState } from "atom.io/ephemeral"
import type { seekState } from "atom.io/immortal"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import {
	findInStore,
	getFromStore,
	getJsonToken,
	type ReadonlySelectorFamily,
	seekInStore,
} from ".."
import { newest } from "../lineage"
import { createReadonlySelector } from "../selector"
import type { Store } from "../store"
import { Subject } from "../subject"
import { throwInCaseOfConflictingFamily } from "./throw-in-case-of-conflicting-family"

export function createReadonlySelectorFamily<T, K extends Canonical>(
	store: Store,
	options: ReadonlySelectorFamilyOptions<T, K>,
	internalRoles?: string[],
): ReadonlySelectorFamilyToken<T, K> {
	const familyToken = {
		key: options.key,
		type: `readonly_selector_family`,
	} as const satisfies ReadonlySelectorFamilyToken<T, K>

	throwInCaseOfConflictingFamily(familyToken, store)

	const subject = new Subject<
		| StateCreation<ReadonlySelectorToken<T>>
		| StateDisposal<ReadonlySelectorToken<T>>
	>()

	const familyFunction = (key: K): ReadonlySelectorToken<T> => {
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
		install: (s: Store) => createReadonlySelectorFamily(s, options),
		default: (key: K) => {
			const getFn = options.get(key)
			return getFn({
				get: ((...ps: [any]) => getFromStore(store, ...ps)) as typeof getState,
				find: ((token, k) => findInStore(store, token, k)) as typeof findState,
				seek: ((token, k) => seekInStore(store, token, k)) as typeof seekState,
				json: (token) => getJsonToken(store, token),
			})
		},
	}) satisfies ReadonlySelectorFamily<T, K>

	store.families.set(options.key, readonlySelectorFamily)
	return familyToken
}
