import type {
	ReadonlyHeldSelectorFamilyOptions,
	ReadonlyHeldSelectorFamilyToken,
	ReadonlyPureSelectorFamilyOptions,
	ReadonlyPureSelectorFamilyToken,
	SelectorFamilyToken,
	WritableHeldSelectorFamilyOptions,
	WritableHeldSelectorFamilyToken,
	WritablePureSelectorFamilyOptions,
	WritablePureSelectorFamilyToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import type { Store } from "../store"
import { createReadonlyHeldSelectorFamily } from "./create-readonly-held-selector-family"
import { createReadonlyPureSelectorFamily } from "./create-readonly-pure-selector-family"
import { createWritableHeldSelectorFamily } from "./create-writable-held-selector-family"
import { createWritablePureSelectorFamily } from "./create-writable-pure-selector-family"

export function createSelectorFamily<T extends object, K extends Canonical>(
	store: Store,
	options: WritableHeldSelectorFamilyOptions<T, K>,
): WritableHeldSelectorFamilyToken<T, K>
export function createSelectorFamily<T extends object, K extends Canonical>(
	store: Store,
	options: ReadonlyHeldSelectorFamilyOptions<T, K>,
): ReadonlyHeldSelectorFamilyToken<T, K>
export function createSelectorFamily<T, K extends Canonical>(
	store: Store,
	options: WritablePureSelectorFamilyOptions<T, K>,
): WritablePureSelectorFamilyToken<T, K>
export function createSelectorFamily<T, K extends Canonical>(
	store: Store,
	options: ReadonlyPureSelectorFamilyOptions<T, K>,
): ReadonlyPureSelectorFamilyToken<T, K>
export function createSelectorFamily(
	store: Store,
	options:
		| ReadonlyHeldSelectorFamilyOptions<any, any>
		| ReadonlyPureSelectorFamilyOptions<any, any>
		| WritableHeldSelectorFamilyOptions<any, any>
		| WritablePureSelectorFamilyOptions<any, any>,
): SelectorFamilyToken<any, any> {
	const isWritable = `set` in options
	const isHeld = `default` in options

	if (isHeld && isWritable) {
		return createWritableHeldSelectorFamily(store, options, undefined)
	}
	if (isHeld) {
		return createReadonlyHeldSelectorFamily(store, options, undefined)
	}
	if (isWritable) {
		return createWritablePureSelectorFamily(store, options)
	}
	return createReadonlyPureSelectorFamily(store, options)
}
