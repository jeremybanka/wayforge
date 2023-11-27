import type {
	FamilyMetadata,
	ReadonlySelectorOptions,
	ReadonlySelectorToken,
	SelectorOptions,
	SelectorToken,
} from "atom.io"

import type { Store } from "../store"
import type { Subject } from "../subject"
import { target } from "../transaction"
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
	const core = target(store)
	const existingWritable = core.selectors.get(options.key)
	const existingReadonly = core.readonlySelectors.get(options.key)

	if (existingWritable || existingReadonly) {
		store.logger.error(
			`❌`,
			existingReadonly ? `readonly_selector` : `selector`,
			options.key,
			`Tried to create selector, but it already exists in the store. (Ignore if you are in development using hot module replacement.)`,
		)
	}

	if (`set` in options) {
		return createReadWriteSelector(options, family, store, core)
	}
	return createReadonlySelector(options, family, store, core)
}
