import type {
	FamilyMetadata,
	SelectorFamily,
	SelectorFamilyOptions,
	SelectorToken,
} from "atom.io"
import type { Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { newest } from "../lineage"
import { createSelector } from "../selector"
import { type Store, deposit } from "../store"
import { Subject } from "../subject"

export function createWritableSelectorFamily<T, K extends Json.Serializable>(
	options: SelectorFamilyOptions<T, K>,
	store: Store,
): SelectorFamily<T, K> {
	const target = newest(store)
	const subject = new Subject<SelectorToken<T>>()

	const selectorFamily = Object.assign(
		(key: K): SelectorToken<T> => {
			const subKey = stringifyJson(key)
			const family: FamilyMetadata = { key: options.key, subKey }
			const fullKey = `${options.key}(${subKey})`
			const existing = target.selectors.get(fullKey)
			if (existing) {
				return deposit(existing)
			}
			const token = createSelector<T>(
				{
					key: fullKey,
					get: options.get(key),
					set: options.set(key),
				},
				family,
				store,
			)
			subject.next(token)
			return token
		},
		{
			key: options.key,
			type: `selector_family`,
			subject,
			install: (store: Store) => createWritableSelectorFamily(options, store),
		} as const,
	) as SelectorFamily<T, K>
	target.families.set(options.key, selectorFamily)
	return selectorFamily
}
