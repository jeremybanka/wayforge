import type {
	FamilyMetadata,
	ReadonlySelectorFamily,
	ReadonlySelectorFamilyOptions,
	SelectorFamily,
	SelectorFamilyOptions,
	SelectorToken,
} from "atom.io"
import type { Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { newest } from "../scion"
import { createSelector } from "../selector"
import type { Store } from "../store"
import { deposit } from "../store"
import { Subject } from "../subject"
import { createReadonlySelectorFamily } from "./create-readonly-selector-family"

export function createSelectorFamily<T, K extends Json.Serializable>(
	options: SelectorFamilyOptions<T, K>,
	store: Store,
): SelectorFamily<T, K>
export function createSelectorFamily<T, K extends Json.Serializable>(
	options: ReadonlySelectorFamilyOptions<T, K>,
	store: Store,
): ReadonlySelectorFamily<T, K>
export function createSelectorFamily<T, K extends Json.Serializable>(
	options: ReadonlySelectorFamilyOptions<T, K> | SelectorFamilyOptions<T, K>,
	store: Store,
): ReadonlySelectorFamily<T, K> | SelectorFamily<T, K> {
	const isReadonly = !(`set` in options)

	if (isReadonly) {
		return createReadonlySelectorFamily(options, store)
	}
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
		} as const,
	) as SelectorFamily<T, K>
	target.families.set(options.key, selectorFamily)
	return selectorFamily
}
