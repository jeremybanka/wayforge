import type {
	FamilyMetadata,
	ReadonlyHeldSelectorFamilyOptions,
	ReadonlyHeldSelectorFamilyToken,
	ReadonlyHeldSelectorToken,
	StateLifecycleEvent,
} from "atom.io"
import { PRETTY_ENTITY_NAMES } from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { newest } from "../lineage"
import { createReadonlyHeldSelector } from "../selector"
import type { ReadonlyHeldSelectorFamily } from "../state-types"
import { Subject } from "../subject"
import type { RootStore } from "../transaction"

export function createReadonlyHeldSelectorFamily<
	T extends object,
	K extends Canonical,
>(
	store: RootStore,
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
	if (existing && store.config.isProduction === true) {
		store.logger.error(
			`❗`,
			type,
			familyKey,
			`Overwriting an existing ${PRETTY_ENTITY_NAMES[existing.type]} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}

	const subject = new Subject<
		StateLifecycleEvent<ReadonlyHeldSelectorToken<T>>
	>()

	const create = (key: K): ReadonlyHeldSelectorToken<T> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata = { key: familyKey, subKey }
		const fullKey = `${familyKey}(${subKey})`
		const target = newest(store)

		return createReadonlyHeldSelector(
			target,
			{
				key: fullKey,
				const: options.const(key),
				get: options.get(key),
			},
			family,
		)
	}

	const readonlySelectorFamily: ReadonlyHeldSelectorFamily<T, K> = {
		...familyToken,
		create,
		internalRoles,
		subject,
		install: (s: RootStore) => createReadonlyHeldSelectorFamily(s, options),
		default: options.const,
	}

	store.families.set(familyKey, readonlySelectorFamily)
	return familyToken
}
