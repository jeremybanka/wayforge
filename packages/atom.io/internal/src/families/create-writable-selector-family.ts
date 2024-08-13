import type {
	FamilyMetadata,
	StateCreation,
	StateDisposal,
	WritableSelectorFamily,
	WritableSelectorFamilyOptions,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { newest } from "../lineage"
import { createWritableSelector } from "../selector"
import type { Store } from "../store"
import { Subject } from "../subject"
import { throwInCaseOfConflictingFamily } from "./throw-in-case-of-conflicting-family"

export function createWritableSelectorFamily<T, K extends Canonical>(
	options: WritableSelectorFamilyOptions<T, K>,
	store: Store,
	internalRoles?: string[],
): WritableSelectorFamily<T, K> {
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
		subject,
		install: (s: Store) => createWritableSelectorFamily(options, s),
		internalRoles,
	}) satisfies WritableSelectorFamily<T, K>

	store.families.set(options.key, selectorFamily)
	return selectorFamily
}
