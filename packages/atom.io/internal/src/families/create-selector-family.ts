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
	options: WritableSelectorFamilyOptions<T, K>,
	store: Store,
): WritableSelectorFamilyToken<T, K>
export function createSelectorFamily<T, K extends Canonical>(
	options: ReadonlySelectorFamilyOptions<T, K>,
	store: Store,
): ReadonlySelectorFamilyToken<T, K>
export function createSelectorFamily<T, K extends Canonical>(
	options:
		| ReadonlySelectorFamilyOptions<T, K>
		| WritableSelectorFamilyOptions<T, K>,
	store: Store,
): SelectorFamilyToken<T, K> {
	const isWritable = `set` in options

	if (isWritable) {
		return createWritableSelectorFamily(options, store)
	}
	return createReadonlySelectorFamily(options, store)
}
