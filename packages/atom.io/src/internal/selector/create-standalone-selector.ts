import type {
	ReadonlyTransientSelectorOptions,
	ReadonlyTransientSelectorToken,
	WritableTransientSelectorOptions,
	WritableTransientSelectorToken,
} from "atom.io"

import type { Store } from "../store"
import { createReadonlySelector } from "./create-readonly-selector"
import { createWritableSelector } from "./create-writable-selector"

export function createStandaloneSelector<T>(
	store: Store,
	options: WritableTransientSelectorOptions<T>,
): WritableTransientSelectorToken<T>
export function createStandaloneSelector<T>(
	store: Store,
	options: ReadonlyTransientSelectorOptions<T>,
): ReadonlyTransientSelectorToken<T>
export function createStandaloneSelector<T>(
	store: Store,
	options:
		| ReadonlyTransientSelectorOptions<T>
		| WritableTransientSelectorOptions<T>,
): ReadonlyTransientSelectorToken<T> | WritableTransientSelectorToken<T> {
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
