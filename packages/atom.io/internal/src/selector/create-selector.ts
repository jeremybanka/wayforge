import type {
	FamilyMetadata,
	ReadonlySelectorOptions,
	ReadonlySelectorToken,
	SelectorOptions,
	SelectorToken,
} from "atom.io"

import { newest } from "../lineage"
import type { Store } from "../store"
import type { Subject } from "../subject"
import { createReadWriteSelector } from "./create-read-write-selector"
import { createReadonlySelector } from "./create-readonly-selector"

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
	const target = newest(store)
	const existingWritable = target.selectors.get(options.key)
	const existingReadonly = target.readonlySelectors.get(options.key)

	if (existingWritable || existingReadonly) {
		store.logger.error(
			`❌`,
			existingReadonly ? `readonly_selector` : `selector`,
			options.key,
			`Tried to create selector, but it already exists in the store.`,
		)
	}

	if (`set` in options) {
		return createReadWriteSelector(options, family, store)
	}
	return createReadonlySelector(options, family, store)
}
