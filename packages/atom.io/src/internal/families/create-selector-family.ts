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

import type { RootStore } from "../transaction"
import { createReadonlyHeldSelectorFamily } from "./create-readonly-held-selector-family"
import { createReadonlyPureSelectorFamily } from "./create-readonly-pure-selector-family"
import { createWritableHeldSelectorFamily } from "./create-writable-held-selector-family"
import { createWritablePureSelectorFamily } from "./create-writable-pure-selector-family"

export function createSelectorFamily<T extends object, K extends Canonical>(
	store: RootStore,
	options: WritableHeldSelectorFamilyOptions<T, K>,
): WritableHeldSelectorFamilyToken<T, K>
export function createSelectorFamily<T extends object, K extends Canonical>(
	store: RootStore,
	options: ReadonlyHeldSelectorFamilyOptions<T, K>,
): ReadonlyHeldSelectorFamilyToken<T, K>
export function createSelectorFamily<T, K extends Canonical, E>(
	store: RootStore,
	options: WritablePureSelectorFamilyOptions<T, K, E>,
): WritablePureSelectorFamilyToken<T, K, E>
export function createSelectorFamily<T, K extends Canonical, E>(
	store: RootStore,
	options: ReadonlyPureSelectorFamilyOptions<T, K, E>,
): ReadonlyPureSelectorFamilyToken<T, K, E>
export function createSelectorFamily(
	store: RootStore,
	options:
		| ReadonlyHeldSelectorFamilyOptions<any, any>
		| ReadonlyPureSelectorFamilyOptions<any, any, any>
		| WritableHeldSelectorFamilyOptions<any, any>
		| WritablePureSelectorFamilyOptions<any, any, any>,
): SelectorFamilyToken<any, any, any> {
	const isWritable = `set` in options
	const isHeld = `const` in options

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
