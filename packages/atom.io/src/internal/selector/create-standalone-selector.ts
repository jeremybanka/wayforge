import type {
	ReadonlySelectorOptions,
	ReadonlySelectorToken,
	WritableSelectorOptions,
	WritableSelectorToken,
} from "atom.io"

import type { Store } from "../store"
import { createReadonlySelector } from "./create-readonly-selector"
import { createWritableSelector } from "./create-writable-selector"

export function createStandaloneSelector<T>(
	store: Store,
	options: WritableSelectorOptions<T>,
): WritableSelectorToken<T>
export function createStandaloneSelector<T>(
	store: Store,
	options: ReadonlySelectorOptions<T>,
): ReadonlySelectorToken<T>
export function createStandaloneSelector<T>(
	store: Store,
	options: ReadonlySelectorOptions<T> | WritableSelectorOptions<T>,
): ReadonlySelectorToken<T> | WritableSelectorToken<T> {
	const isWritable = `set` in options

	if (isWritable) {
		const state = createWritableSelector(store, options, undefined)
		store.on.selectorCreation.next(state)
		return state
	}
	const state = createReadonlySelector(store, options, undefined)
	store.on.selectorCreation.next(state)
	return state
}
