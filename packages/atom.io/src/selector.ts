import {
	createSelectorFamily,
	createStandaloneSelector,
	IMPLICIT,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type { ReadonlySelectorToken, WritableSelectorToken } from "."
import type { Read, Write } from "./transaction"

export type WritableSelectorOptions<T> = {
	key: string
	get: Read<() => T>
	set: Write<(newValue: T) => void>
}
export type ReadonlySelectorOptions<T> = {
	key: string
	get: Read<() => T>
}

/**
 * @public
 * Declare a selector. The value of a selector should depend
 * on the value of atoms or other selectors in the store.
 *
 * A writable selector can be "set" to a new value.
 * It is advised to set its dependencies to values
 * that would produce the new value of the selector.
 * @param options - {@link WritableSelectorOptions}.
 * @returns
 * The token for your selector.
 * @overload Writable
 */
export function selector<T>(
	options: WritableSelectorOptions<T>,
): WritableSelectorToken<T>

/**
 * @public
 * Declare a selector. The value of a selector should depend
 * on the value of atoms or other selectors in the store.
 * @param options - {@link ReadonlySelectorOptions}.
 */
export function selector<T>(
	options: ReadonlySelectorOptions<T>,
): ReadonlySelectorToken<T>
export function selector<T>(
	options: ReadonlySelectorOptions<T> | WritableSelectorOptions<T>,
): ReadonlySelectorToken<T> | WritableSelectorToken<T> {
	return createStandaloneSelector(IMPLICIT.STORE, options)
}

export type WritableSelectorFamilyOptions<T, K extends Canonical> = {
	key: string
	get: (key: K) => Read<() => T>
	set: (key: K) => Write<(newValue: T) => void>
}
export type ReadonlySelectorFamilyOptions<T, K extends Canonical> = {
	key: string
	get: (key: K) => Read<() => T>
}

export type WritableSelectorFamilyToken<T, K extends Canonical> = {
	key: string
	type: `selector_family`
	__T?: T
	__K?: K
}

export type ReadonlySelectorFamilyToken<T, K extends Canonical> = {
	key: string
	type: `readonly_selector_family`
	__T?: T
	__K?: K
}

export type SelectorFamilyToken<T, K extends Canonical> =
	| ReadonlySelectorFamilyToken<T, K>
	| WritableSelectorFamilyToken<T, K>

export function selectorFamily<T, K extends Canonical>(
	options: WritableSelectorFamilyOptions<T, K>,
): WritableSelectorFamilyToken<T, K>
export function selectorFamily<T, K extends Canonical>(
	options: ReadonlySelectorFamilyOptions<T, K>,
): ReadonlySelectorFamilyToken<T, K>
export function selectorFamily<T, K extends Canonical>(
	options:
		| ReadonlySelectorFamilyOptions<T, K>
		| WritableSelectorFamilyOptions<T, K>,
): ReadonlySelectorFamilyToken<T, K> | WritableSelectorFamilyToken<T, K> {
	return createSelectorFamily(IMPLICIT.STORE, options)
}
