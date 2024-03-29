import type {
	FamilyMetadata,
	ReadonlySelectorFamily,
	ReadonlySelectorFamilyOptions,
	ReadonlySelectorToken,
} from "atom.io"
import type { Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { newest } from "../lineage"
import { createReadonlySelector } from "../selector"
import type { Store } from "../store"
import { deposit } from "../store"
import { Subject } from "../subject"

export function createReadonlySelectorFamily<T, K extends Json.Serializable>(
	options: ReadonlySelectorFamilyOptions<T, K>,
	store: Store,
): ReadonlySelectorFamily<T, K> {
	const subject = new Subject<ReadonlySelectorToken<T>>()
	const readonlySelectorFamily = Object.assign(
		(key: K): ReadonlySelectorToken<T> => {
			const target = newest(store)
			const subKey = stringifyJson(key)
			const family: FamilyMetadata = { key: options.key, subKey }
			const fullKey = `${options.key}(${subKey})`
			const existing = target.readonlySelectors.get(fullKey)
			if (existing) {
				return deposit(existing)
			}
			return createReadonlySelector(
				{
					key: fullKey,
					get: options.get(key),
				},
				family,
				store,
			) as ReadonlySelectorToken<T>
		},
		{
			key: options.key,
			type: `readonly_selector_family`,
			subject,
			install: (store: Store) => createReadonlySelectorFamily(options, store),
		} as const,
	) as ReadonlySelectorFamily<T, K>
	store.families.set(options.key, readonlySelectorFamily)
	return readonlySelectorFamily
}
