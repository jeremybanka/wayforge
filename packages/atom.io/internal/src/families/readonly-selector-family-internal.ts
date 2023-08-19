import type {
	FamilyMetadata,
	ReadonlySelectorFamily,
	ReadonlySelectorFamilyOptions,
	ReadonlySelectorToken,
} from "atom.io"

import type { Json } from "~/packages/anvl/src/json"
import { stringifyJson } from "~/packages/anvl/src/json"

import { selector__INTERNAL } from "../selector"
import { deposit, type Store } from "../store"
import { Subject } from "../subject"
import { target } from "../transaction"

export function readonlySelectorFamily__INTERNAL<T, K extends Json.Serializable>(
	options: ReadonlySelectorFamilyOptions<T, K>,
	store?: Store,
): ReadonlySelectorFamily<T, K> {
	const core = target(store)
	const subject = new Subject<ReadonlySelectorToken<T>>()
	return Object.assign(
		(key: K): ReadonlySelectorToken<T> => {
			const subKey = stringifyJson(key)
			const family: FamilyMetadata = { key: options.key, subKey }
			const fullKey = `${options.key}(${subKey})`
			const existing = core.readonlySelectors.get(fullKey)
			if (existing) {
				return deposit(existing)
			}
			return selector__INTERNAL<T>(
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
