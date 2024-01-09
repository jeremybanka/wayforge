import type {
	FamilyMetadata,
	ReadonlySelectorOptions,
	ReadonlySelectorToken,
	WritableSelectorOptions,
	WritableSelectorToken,
} from "atom.io"

import type { Store } from "../store"
import type { Subject } from "../subject"
import { createReadonlySelector } from "./create-readonly-selector"
import { createWritableSelector } from "./create-writable-selector"

export type WritableSelector<T> = {
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
	options: WritableSelectorOptions<T>,
	store: Store,
): WritableSelectorToken<T>
export function createStandaloneSelector<T>(
	options: ReadonlySelectorOptions<T>,
	store: Store,
): ReadonlySelectorToken<T>
export function createStandaloneSelector<T>(
	options: ReadonlySelectorOptions<T> | WritableSelectorOptions<T>,
	store: Store,
): ReadonlySelectorToken<T> | WritableSelectorToken<T> {
	const isWritable = `set` in options

	if (isWritable) {
		return createWritableSelector(options, undefined, store)
	}
	return createReadonlySelector(options, undefined, store)
}
