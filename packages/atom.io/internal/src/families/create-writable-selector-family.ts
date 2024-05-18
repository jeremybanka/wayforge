import type {
	FamilyMetadata,
	WritableSelectorFamily,
	WritableSelectorFamilyOptions,
	WritableSelectorToken,
} from "atom.io"
import type { Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { newest } from "../lineage"
import { createWritableSelector } from "../selector"
import type { Store } from "../store"
import { Subject } from "../subject"

export function createWritableSelectorFamily<T, K extends Json.Serializable>(
	options: WritableSelectorFamilyOptions<T, K>,
	store: Store,
): WritableSelectorFamily<T, K> {
	const subject = new Subject<WritableSelectorToken<T>>()

	const selectorFamily = Object.assign(
		(key: K): WritableSelectorToken<T> => {
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

			subject.next(token)
			return token
		},
		{
			key: options.key,
			type: `selector_family`,
			subject,
			install: (s: Store) => createWritableSelectorFamily(options, s),
		} as const,
	) satisfies WritableSelectorFamily<T, K>
	store.families.set(options.key, selectorFamily)
	return selectorFamily
}
