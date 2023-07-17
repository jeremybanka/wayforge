import HAMT from "hamt_plus"

import { target, IMPLICIT } from "."
import type { Store, Subject } from "."
import { createReadWriteSelector } from "./selector/create-read-write-selector"
import { createReadonlySelector } from "./selector/create-readonly-selector"
import type {
	FamilyMetadata,
	ReadonlySelectorOptions,
	ReadonlySelectorToken,
	SelectorOptions,
	SelectorToken,
} from ".."

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

export function selector__INTERNAL<T>(
	options: SelectorOptions<T>,
	family?: FamilyMetadata,
	store?: Store,
): SelectorToken<T>
export function selector__INTERNAL<T>(
	options: ReadonlySelectorOptions<T>,
	family?: FamilyMetadata,
	store?: Store,
): ReadonlySelectorToken<T>
export function selector__INTERNAL<T>(
	options: ReadonlySelectorOptions<T> | SelectorOptions<T>,
	family?: FamilyMetadata,
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<T> | SelectorToken<T> {
	const core = target(store)

	if (HAMT.has(options.key, core.selectors)) {
		store.config.logger?.error(
			`Key "${options.key}" already exists in the store.`,
		)
	}

	if (!(`set` in options)) {
		return createReadonlySelector(options, family, store, core)
	}
	return createReadWriteSelector(options, family, store, core)
}
