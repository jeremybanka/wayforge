import type {
	ReadonlyTransientSelectorFamilyOptions,
	ReadonlyTransientSelectorFamilyToken,
	SelectorFamilyToken,
	WritableTransientSelectorFamilyOptions,
	WritableTransientSelectorFamilyToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import type { Store } from "../store"
import { createReadonlyTransientSelectorFamily } from "./create-readonly-selector-family"
import { createWritableTransientSelectorFamily } from "./create-writable-selector-family"

export function createSelectorFamily<T, K extends Canonical>(
	store: Store,
	options: WritableTransientSelectorFamilyOptions<T, K>,
): WritableTransientSelectorFamilyToken<T, K>
export function createSelectorFamily<T, K extends Canonical>(
	store: Store,
	options: ReadonlyTransientSelectorFamilyOptions<T, K>,
): ReadonlyTransientSelectorFamilyToken<T, K>
export function createSelectorFamily<T, K extends Canonical>(
	store: Store,
	options:
		| ReadonlyTransientSelectorFamilyOptions<T, K>
		| WritableTransientSelectorFamilyOptions<T, K>,
): SelectorFamilyToken<T, K> {
	const isWritable = `set` in options

	if (isWritable) {
		return createWritableTransientSelectorFamily(store, options)
	}
	return createReadonlyTransientSelectorFamily(store, options)
}
