import type {
	FamilyMetadata,
	ReadonlySelectorFamily,
	ReadonlySelectorFamilyOptions,
	ReadonlySelectorToken,
} from "atom.io"
import type { Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { newest } from "../lineage"
import { NotFoundError } from "../not-found-error"
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

			subject.next(token)
			return token
		},
		{
			key: options.key,
			type: `readonly_selector_family`,
			subject,
			install: (s: Store) => createReadonlySelectorFamily(options, s),
		} as const,
	) satisfies ReadonlySelectorFamily<T, K>
	store.families.set(options.key, readonlySelectorFamily)
	return readonlySelectorFamily
}
