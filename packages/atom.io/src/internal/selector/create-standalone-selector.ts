import type {
	ReadonlyHeldSelectorOptions,
	ReadonlyHeldSelectorToken,
	ReadonlyPureSelectorOptions,
	ReadonlyPureSelectorToken,
	WritableHeldSelectorOptions,
	WritableHeldSelectorToken,
	WritablePureSelectorOptions,
	WritablePureSelectorToken,
} from "atom.io"

import type { Store } from "../store"
import { createReadonlyHeldSelector } from "./create-readonly-held-selector"
import { createReadonlyPureSelector } from "./create-readonly-pure-selector"
import { createWritableHeldSelector } from "./create-writable-held-selector"
import { createWritablePureSelector } from "./create-writable-pure-selector"

export function createStandaloneSelector<T extends object>(
	store: Store,
	options: WritableHeldSelectorOptions<T>,
): WritableHeldSelectorToken<T>
export function createStandaloneSelector<T extends object>(
	store: Store,
	options: ReadonlyHeldSelectorOptions<T>,
): ReadonlyHeldSelectorToken<T>
export function createStandaloneSelector<T, E>(
	store: Store,
	options: WritablePureSelectorOptions<T, E>,
): WritablePureSelectorToken<T, any, E>
export function createStandaloneSelector<T, E>(
	store: Store,
	options: ReadonlyPureSelectorOptions<T, E>,
): ReadonlyPureSelectorToken<T, any, E>
export function createStandaloneSelector(
	store: Store,
	options:
		| ReadonlyHeldSelectorOptions<any>
		| ReadonlyPureSelectorOptions<any, any>
		| WritableHeldSelectorOptions<any>
		| WritablePureSelectorOptions<any, any>,
):
	| ReadonlyHeldSelectorToken<any>
	| ReadonlyPureSelectorToken<any, any, any>
	| WritableHeldSelectorToken<any>
	| WritablePureSelectorToken<any, any, any> {
	const isWritable = `set` in options
	const isHeld = `const` in options

	if (isHeld && isWritable) {
		const state = createWritableHeldSelector(store, options, undefined)
		store.on.selectorCreation.next(state)
		return state
	}
	if (isHeld) {
		const state = createReadonlyHeldSelector(store, options, undefined)
		store.on.selectorCreation.next(state)
		return state
	}
	if (isWritable) {
		const state = createWritablePureSelector(store, options, undefined)
		store.on.selectorCreation.next(state)
		return state
	}
	const state = createReadonlyPureSelector(store, options, undefined)
	store.on.selectorCreation.next(state)
	return state
}
