import type {
	FamilyMetadata,
	ReadonlySelectorOptions,
	ReadonlySelectorToken,
	SelectorOptions,
	SelectorToken,
} from "atom.io"

import { IMPLICIT, type Store } from "../store"
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

	if (core.selectors.has(options.key)) {
		store.config.logger?.error(
			`Key "${options.key}" already exists in the store.`,
		)
	}

	if (!(`set` in options)) {
		return createReadonlySelector(options, family, store, core)
	}
	return createReadWriteSelector(options, family, store, core)
}
