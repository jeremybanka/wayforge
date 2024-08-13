import type {
	FamilyMetadata,
	ReadonlySelectorFamily,
	ReadonlySelectorFamilyOptions,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { newest } from "../lineage"
import { createReadonlySelector } from "../selector"
import type { Store } from "../store"
import { Subject } from "../subject"
import { throwInCaseOfConflictingFamily } from "./throw-in-case-of-conflicting-family"

export function createReadonlySelectorFamily<T, K extends Canonical>(
	options: ReadonlySelectorFamilyOptions<T, K>,
	store: Store,
): ReadonlySelectorFamily<T, K> {
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
			{
				key: fullKey,
				get: options.get(key),
			},
			family,
			target,
		)

		subject.next({ type: `state_creation`, token })
		return token
	}

	const readonlySelectorFamily = Object.assign(familyFunction, familyToken, {
		subject,
		install: (s: Store) => createReadonlySelectorFamily(options, s),
	}) satisfies ReadonlySelectorFamily<T, K>

	store.families.set(options.key, readonlySelectorFamily)
	return readonlySelectorFamily
}
