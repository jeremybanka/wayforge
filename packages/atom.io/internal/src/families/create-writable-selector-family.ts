import type {
	FamilyMetadata,
	SelectorFamily,
	SelectorFamilyOptions,
	SelectorToken,
} from "atom.io"
import type { Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { newest } from "../lineage"
import { createWritableSelector } from "../selector"
import type { Store } from "../store"
import { deposit } from "../store"
import { Subject } from "../subject"

export function createWritableSelectorFamily<T, K extends Json.Serializable>(
	options: SelectorFamilyOptions<T, K>,
	store: Store,
): SelectorFamily<T, K> {
	const subject = new Subject<SelectorToken<T>>()

	const selectorFamily = Object.assign(
		(key: K): SelectorToken<T> => {
			const subKey = stringifyJson(key)
			const family: FamilyMetadata = { key: options.key, subKey }
			const fullKey = `${options.key}(${subKey})`
			const existing = store.selectors.get(fullKey)
			if (existing) {
				return deposit(existing)
			}
			const token = createWritableSelector(
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
	store.families.set(options.key, selectorFamily)
	return selectorFamily
}
