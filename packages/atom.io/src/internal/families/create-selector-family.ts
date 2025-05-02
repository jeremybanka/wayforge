import type {
	ReadonlySelectorFamilyOptions,
	ReadonlySelectorFamilyToken,
	SelectorFamilyToken,
	WritableSelectorFamilyOptions,
	WritableSelectorFamilyToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import type { Store } from "../store"
import { createReadonlySelectorFamily } from "./create-readonly-selector-family"
import { createWritableSelectorFamily } from "./create-writable-selector-family"

export function createSelectorFamily<T, K extends Canonical>(
	store: Store,
	options: WritableSelectorFamilyOptions<T, K>,
): WritableSelectorFamilyToken<T, K>
export function createSelectorFamily<T, K extends Canonical>(
	store: Store,
	options: ReadonlySelectorFamilyOptions<T, K>,
): ReadonlySelectorFamilyToken<T, K>
export function createSelectorFamily<T, K extends Canonical>(
	store: Store,
	options:
		| ReadonlySelectorFamilyOptions<T, K>
		| WritableSelectorFamilyOptions<T, K>,
): SelectorFamilyToken<T, K> {
	const isWritable = `set` in options

	if (isWritable) {
		return createWritableSelectorFamily(store, options)
	}
	return createReadonlySelectorFamily(store, options)
}
