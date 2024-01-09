import type {
	ReadonlySelectorFamily,
	ReadonlySelectorFamilyOptions,
	SelectorFamily,
	SelectorFamilyOptions,
} from "atom.io"
import type { Json } from "atom.io/json"

import type { Store } from "../store"
import { createReadonlySelectorFamily } from "./create-readonly-selector-family"
import { createWritableSelectorFamily } from "./create-writable-selector-family"

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
	const isWritable = `set` in options

	if (isWritable) {
		return createWritableSelectorFamily(options, store)
	}
	return createReadonlySelectorFamily(options, store)
}
