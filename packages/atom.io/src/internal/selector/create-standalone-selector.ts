import type {
	ReadonlyPureSelectorOptions,
	ReadonlyPureSelectorToken,
	WritablePureSelectorOptions,
	WritablePureSelectorToken,
} from "atom.io"

import type { Store } from "../store"
import { createReadonlyPureSelector } from "./create-readonly-pure-selector"
import { createWritablePureSelector } from "./create-writable-pure-selector"

export function createStandaloneSelector<T>(
	store: Store,
	options: WritablePureSelectorOptions<T>,
): WritablePureSelectorToken<T>
export function createStandaloneSelector<T>(
	store: Store,
	options: ReadonlyPureSelectorOptions<T>,
): ReadonlyPureSelectorToken<T>
export function createStandaloneSelector<T>(
	store: Store,
	options: ReadonlyPureSelectorOptions<T> | WritablePureSelectorOptions<T>,
): ReadonlyPureSelectorToken<T> | WritablePureSelectorToken<T> {
	const isWritable = `set` in options

	if (isWritable) {
		const state = createWritablePureSelector(store, options, undefined)
		store.on.selectorCreation.next(state)
		return state
	}
	const state = createReadonlyPureSelector(store, options, undefined)
	store.on.selectorCreation.next(state)
	return state
}
