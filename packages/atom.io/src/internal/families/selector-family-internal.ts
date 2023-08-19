import type { Json } from "~/packages/anvl/src/json"
import { stringifyJson } from "~/packages/anvl/src/json"

import { readonlySelectorFamily__INTERNAL } from "./readonly-selector-family-internal"
import type { FamilyMetadata, SelectorToken } from "../.."
import type {
	ReadonlySelectorFamily,
	ReadonlySelectorFamilyOptions,
	SelectorFamily,
	SelectorFamilyOptions,
} from "../../selector"
import { selector__INTERNAL } from "../selector"
import type { Store } from "../store"
import { IMPLICIT, deposit } from "../store"
import { Subject } from "../subject"
import { target } from "../transaction"

export function selectorFamily__INTERNAL<T, K extends Json.Serializable>(
	options: SelectorFamilyOptions<T, K>,
	store?: Store,
): SelectorFamily<T, K>
export function selectorFamily__INTERNAL<T, K extends Json.Serializable>(
	options: ReadonlySelectorFamilyOptions<T, K>,
	store?: Store,
): ReadonlySelectorFamily<T, K>
export function selectorFamily__INTERNAL<T, K extends Json.Serializable>(
	options: ReadonlySelectorFamilyOptions<T, K> | SelectorFamilyOptions<T, K>,
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorFamily<T, K> | SelectorFamily<T, K> {
	const isReadonly = !(`set` in options)

	if (isReadonly) {
		return readonlySelectorFamily__INTERNAL(options, store)
	}
	const core = target(store)
	const subject = new Subject<SelectorToken<T>>()

	return Object.assign(
		(key: K): SelectorToken<T> => {
			const subKey = stringifyJson(key)
			const family: FamilyMetadata = { key: options.key, subKey }
			const fullKey = `${options.key}(${subKey})`
			const existing = core.selectors.get(fullKey)
			if (existing) {
				return deposit(existing)
			}
			const token = selector__INTERNAL<T>(
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
}
