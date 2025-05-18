import type {
	FamilyMetadata,
	StateCreation,
	StateDisposal,
	WritableHeldSelectorFamilyOptions,
	WritableHeldSelectorFamilyToken,
	WritableHeldSelectorToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { prettyPrintTokenType, type WritableHeldSelectorFamily } from ".."
import { newest } from "../lineage"
import { createWritableHeldSelector } from "../selector"
import type { Store } from "../store"
import { Subject } from "../subject"

export function createWritableHeldSelectorFamily<
	T extends object,
	K extends Canonical,
>(
	store: Store,
	options: WritableHeldSelectorFamilyOptions<T, K>,
	internalRoles?: string[],
): WritableHeldSelectorFamilyToken<T, K> {
	const familyKey = options.key
	const type = `writable_held_selector_family`

	const familyToken = {
		key: familyKey,
		type,
	} as const satisfies WritableHeldSelectorFamilyToken<T, K>

	const existing = store.families.get(familyKey)
	if (existing) {
		store.logger.error(
			`❗`,
			type,
			familyKey,
			`Overwriting an existing ${prettyPrintTokenType(
				existing,
			)} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}
	const subject = new Subject<
		| StateCreation<WritableHeldSelectorToken<T>>
		| StateDisposal<WritableHeldSelectorToken<T>>
	>()

	const familyFunction = (key: K): WritableHeldSelectorToken<T> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata = { key: familyKey, subKey }
		const fullKey = `${familyKey}(${subKey})`
		const target = newest(store)

		const token = createWritableHeldSelector(
			target,
			{
				key: fullKey,
				const: options.const(key),
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
		install: (s: Store) => createWritableHeldSelectorFamily(s, options),
		default: options.const,
	}) satisfies WritableHeldSelectorFamily<T, K>

	store.families.set(familyKey, selectorFamily)
	return familyToken
}
