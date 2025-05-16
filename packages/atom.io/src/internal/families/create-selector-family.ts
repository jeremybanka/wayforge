import type {
	ReadonlyPureSelectorFamilyOptions,
	ReadonlyPureSelectorFamilyToken,
	SelectorFamilyToken,
	WritablePureSelectorFamilyOptions,
	WritablePureSelectorFamilyToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import type { Store } from "../store"
import { createReadonlyPureSelectorFamily } from "./create-readonly-pure-selector-family"
import { createWritablePureSelectorFamily } from "./create-writable-pure-selector-family"

export function createSelectorFamily<T, K extends Canonical>(
	store: Store,
	options: WritablePureSelectorFamilyOptions<T, K>,
): WritablePureSelectorFamilyToken<T, K>
export function createSelectorFamily<T, K extends Canonical>(
	store: Store,
	options: ReadonlyPureSelectorFamilyOptions<T, K>,
): ReadonlyPureSelectorFamilyToken<T, K>
export function createSelectorFamily<T, K extends Canonical>(
	store: Store,
	options:
		| ReadonlyPureSelectorFamilyOptions<T, K>
		| WritablePureSelectorFamilyOptions<T, K>,
): SelectorFamilyToken<T, K> {
	const isWritable = `set` in options
	const isHeld = `default` in options

	if (isWritable) {
		return createWritablePureSelectorFamily(store, options)
	}
	return createReadonlyPureSelectorFamily(store, options)
}
