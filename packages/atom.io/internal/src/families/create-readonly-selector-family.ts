import type {
	FamilyMetadata,
	ReadonlySelectorFamily,
	ReadonlySelectorFamilyOptions,
	ReadonlySelectorToken,
} from "atom.io"
import type { Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { newest } from "../scion"
import { createSelector } from "../selector"
import { type Store, deposit } from "../store"
import { Subject } from "../subject"

export function createReadonlySelectorFamily<T, K extends Json.Serializable>(
	options: ReadonlySelectorFamilyOptions<T, K>,
	store: Store,
): ReadonlySelectorFamily<T, K> {
	const subject = new Subject<ReadonlySelectorToken<T>>()
	return Object.assign(
		(key: K): ReadonlySelectorToken<T> => {
			const target = newest(store)
			const subKey = stringifyJson(key)
			const family: FamilyMetadata = { key: options.key, subKey }
			const fullKey = `${options.key}(${subKey})`
			const existing = target.readonlySelectors.get(fullKey)
			if (existing) {
				return deposit(existing)
			}
			return createSelector<T>(
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
		} as const,
	) as ReadonlySelectorFamily<T, K>
}
