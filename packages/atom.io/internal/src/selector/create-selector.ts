import type {
	FamilyMetadata,
	ReadonlySelectorOptions,
	ReadonlySelectorToken,
	SelectorOptions,
	SelectorToken,
} from "atom.io"

import type { Store } from "../store"
import type { Subject } from "../subject"
import { createReadonlySelector } from "./create-readonly-selector"
import { createWritableSelector } from "./create-writable-selector"

export type Selector<T> = {
	key: string
	type: `selector`
	family?: FamilyMetadata
	install: (store: Store) => void
	subject: Subject<{ newValue: T; oldValue: T }>
	get: () => T
	set: (newValue: T | ((oldValue: T) => T)) => void
}
export type ReadonlySelector<T> = {
	key: string
	type: `readonly_selector`
	family?: FamilyMetadata
	install: (store: Store) => void
	subject: Subject<{ newValue: T; oldValue: T }>
	get: () => T
}

export function createSelector<T>(
	options: SelectorOptions<T>,
	family: FamilyMetadata | undefined,
	store: Store,
): SelectorToken<T>
export function createSelector<T>(
	options: ReadonlySelectorOptions<T>,
	family: FamilyMetadata | undefined,
	store: Store,
): ReadonlySelectorToken<T>
export function createSelector<T>(
	options: ReadonlySelectorOptions<T> | SelectorOptions<T>,
	family: FamilyMetadata | undefined,
	store: Store,
): ReadonlySelectorToken<T> | SelectorToken<T> {
	const isWritable = `set` in options

	if (isWritable) {
		return createWritableSelector(options, family, store)
	}
	return createReadonlySelector(options, family, store)
}
