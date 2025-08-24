import type {
	FamilyMetadata,
	ReadonlyHeldSelectorFamilyOptions,
	ReadonlyHeldSelectorFamilyToken,
	ReadonlyHeldSelectorToken,
	StateLifecycleEvent,
} from "atom.io"
import { PRETTY_TOKEN_TYPES } from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { ReadonlyHeldSelectorFamily } from ".."
import { newest } from "../lineage"
import { createReadonlyHeldSelector } from "../selector"
import type { Store } from "../store"
import { Subject } from "../subject"

export function createReadonlyHeldSelectorFamily<
	T extends object,
	K extends Canonical,
>(
	store: Store,
	options: ReadonlyHeldSelectorFamilyOptions<T, K>,
	internalRoles?: string[],
): ReadonlyHeldSelectorFamilyToken<T, K> {
	const familyKey = options.key
	const type = `readonly_held_selector_family`

	const familyToken = {
		key: familyKey,
		type,
	} as const satisfies ReadonlyHeldSelectorFamilyToken<T, K>

	const existing = store.families.get(familyKey)
	if (existing) {
		store.logger.error(
			`❗`,
			type,
			familyKey,
			`Overwriting an existing ${PRETTY_TOKEN_TYPES[existing.type]} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}

	const subject = new Subject<
		StateLifecycleEvent<ReadonlyHeldSelectorToken<T>>
	>()

	const familyFunction = (key: K): ReadonlyHeldSelectorToken<T> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata = { key: familyKey, subKey }
		const fullKey = `${familyKey}(${subKey})`
		const target = newest(store)

		const token = createReadonlyHeldSelector(
			target,
			{
				key: fullKey,
				const: options.const(key),
				get: options.get(key),
			},
			family,
		)

		// subject.next({ type: `state_creation`, token, timestamp: Date.now() })
		return token
	}

	const readonlySelectorFamily = Object.assign(familyFunction, familyToken, {
		internalRoles,
		subject,
		install: (s: Store) => createReadonlyHeldSelectorFamily(s, options),
		default: options.const,
	}) satisfies ReadonlyHeldSelectorFamily<T, K>

	store.families.set(familyKey, readonlySelectorFamily)
	return familyToken
}
