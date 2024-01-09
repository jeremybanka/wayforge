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

export function createStandaloneSelector<T>(
	options: SelectorOptions<T>,
	store: Store,
): SelectorToken<T>
export function createStandaloneSelector<T>(
	options: ReadonlySelectorOptions<T>,
	store: Store,
): ReadonlySelectorToken<T>
export function createStandaloneSelector<T>(
	options: ReadonlySelectorOptions<T> | SelectorOptions<T>,
	store: Store,
): ReadonlySelectorToken<T> | SelectorToken<T> {
	const isWritable = `set` in options

	if (isWritable) {
		return createWritableSelector(options, undefined, store)
	}
	return createReadonlySelector(options, undefined, store)
}
