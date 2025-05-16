import {
	createSelectorFamily,
	createStandaloneSelector,
	IMPLICIT,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type {
	ReadonlyRecyclableSelectorToken,
	ReadonlyTransientSelectorToken,
	WritableRecyclableSelectorToken,
	WritableTransientSelectorToken,
} from "."
import type { Read, Write } from "./transaction"

export type WritableTransientSelectorOptions<T> = {
	key: string
	get: Read<() => T>
	set: Write<(newValue: T) => void>
}
export type ReadonlyTransientSelectorOptions<T> = {
	key: string
	get: Read<() => T>
}
export type ReadonlyRecyclableSelectorOptions<T extends object> = {
	key: string
	default: T | (() => T)
	get: Read<(permanent: T) => void>
}
export type WritableRecyclableSelectorOptions<T extends object> = {
	key: string
	default: T | (() => T)
	get: Read<(permanent: T) => void>
	set: Write<(newValue: T) => void>
}

/**
 * @public
 * Declare a selector. The value of a selector should depend
 * on the value of atoms or other selectors in the store, and
 * should be recycled when a root atom of the selector is set.
 *
 * A recyclable selector's value must be some object.
 * The reference to that object is permanent and will not be replaced.
 *
 * A writable selector can be "set" to a new value.
 * It is advised to set its dependencies to values
 * that would produce the new value of the selector.
 *
 * @param options - {@link WritableRecyclableSelectorOptions}.
 * @returns
 * The token for your selector.
 * @overload WritableRecyclable
 */
export function selector<T extends object>(
	options: WritableRecyclableSelectorOptions<T>,
): WritableRecyclableSelectorToken<T>

/**
 * @public
 * Declare a selector. The value of a selector should depend
 * on the value of atoms or other selectors in the store,
 * and should be recycled when a root atom of the selector is set.
 *
 * A recyclable selector's value must be some object.
 * The reference to that object is permanent and will not be replaced.
 *
 * A readonly selector can be "gotten" but not "set".
 *
 * @param options - {@link ReadonlyRecyclableSelectorOptions}.
 * @returns
 * The token for your selector.
 * @overload ReadonlyRecyclable
 */
export function selector<T extends object>(
	options: ReadonlyRecyclableSelectorOptions<T>,
): ReadonlyRecyclableSelectorToken<T>

/**
 * @public
 * Declare a selector. The value of a selector should depend
 * on the value of atoms or other selectors in the store.
 *
 * A transient selector's current value is evicted from the store
 * in order to be garbage collected when a root atom of the selector is set.
 *
 * A writable selector can be "set" to a new value.
 * It is advised to set its dependencies to values
 * that would produce the new value of the selector.
 *
 * @param options - {@link TransientWritableSelectorOptions}.
 * @returns
 * The token for your selector.
 * @overload WritableTransient
 */
export function selector<T>(
	options: WritableTransientSelectorOptions<T>,
): WritableTransientSelectorToken<T>

/**
 * @public
 * Declare a selector. The value of a selector should depend
 * on the value of atoms or other selectors in the store.
 *
 * A transient selector's current value is evicted from the store
 * in order to be garbage collected when a root atom of the selector is set.
 *
 * A readonly selector can be "gotten" but not "set".
 *
 * @param options - {@link ReadonlyTransientSelectorOptions}.
 * @returns
 * The token for your selector.
 * @overload ReadonlyTransient
 */
export function selector<T>(
	options: ReadonlyTransientSelectorOptions<T>,
): ReadonlyTransientSelectorToken<T>

export function selector(
	options:
		| ReadonlyRecyclableSelectorOptions<any>
		| ReadonlyTransientSelectorOptions<any>
		| WritableRecyclableSelectorOptions<any>
		| WritableTransientSelectorOptions<any>,
):
	| ReadonlyRecyclableSelectorToken<any>
	| ReadonlyTransientSelectorToken<any>
	| WritableRecyclableSelectorToken<any>
	| WritableTransientSelectorToken<any> {
	return createStandaloneSelector(IMPLICIT.STORE, options)
}

export type WritableTransientSelectorFamilyOptions<T, K extends Canonical> = {
	key: string
	get: (key: K) => Read<() => T>
	set: (key: K) => Write<(newValue: T) => void>
}
export type ReadonlyTransientSelectorFamilyOptions<T, K extends Canonical> = {
	key: string
	get: (key: K) => Read<() => T>
}
export type WritableRecyclableSelectorFamilyOptions<T, K extends Canonical> = {
	key: string
	default: (key: K) => T
	get: (key: K) => Read<(permanent: T) => void>
	set: (key: K) => Write<(newValue: T) => void>
}
export type ReadonlyRecyclableSelectorFamilyOptions<T, K extends Canonical> = {
	key: string
	default: (key: K) => T
	get: (key: K) => Read<(permanent: T) => void>
}

export type WritableTransientSelectorFamilyToken<T, K extends Canonical> = {
	key: string
	type: `writable_transient_selector_family`
	__T?: T
	__K?: K
}
export type ReadonlyTransientSelectorFamilyToken<T, K extends Canonical> = {
	key: string
	type: `readonly_transient_selector_family`
	__T?: T
	__K?: K
}
export type WritableRecyclableSelectorFamilyToken<T, K extends Canonical> = {
	key: string
	type: `writable_recyclable_selector_family`
	__T?: T
	__K?: K
}
export type ReadonlyRecyclableSelectorFamilyToken<T, K extends Canonical> = {
	key: string
	type: `readonly_recyclable_selector_family`
	__T?: T
	__K?: K
}

export type TransientSelectorFamilyToken<T, K extends Canonical> =
	| ReadonlyTransientSelectorFamilyToken<T, K>
	| WritableTransientSelectorFamilyToken<T, K>
export type RecyclableSelectorFamilyToken<T, K extends Canonical> =
	| ReadonlyRecyclableSelectorFamilyToken<T, K>
	| WritableRecyclableSelectorFamilyToken<T, K>
export type ReadonlySelectorFamilyToken<T, K extends Canonical> =
	| ReadonlyRecyclableSelectorFamilyToken<T, K>
	| ReadonlyTransientSelectorFamilyToken<T, K>

export type WritableSelectorFamilyToken<T, K extends Canonical> =
	| WritableRecyclableSelectorFamilyToken<T, K>
	| WritableTransientSelectorFamilyToken<T, K>

export type SelectorFamilyToken<T, K extends Canonical> =
	| RecyclableSelectorFamilyToken<T, K>
	| TransientSelectorFamilyToken<T, K>

export function selectorFamily<T, K extends Canonical>(
	options: WritableTransientSelectorFamilyOptions<T, K>,
): WritableTransientSelectorFamilyToken<T, K>
export function selectorFamily<T, K extends Canonical>(
	options: ReadonlyTransientSelectorFamilyOptions<T, K>,
): ReadonlyTransientSelectorFamilyToken<T, K>
export function selectorFamily<T, K extends Canonical>(
	options:
		| ReadonlyTransientSelectorFamilyOptions<T, K>
		| WritableTransientSelectorFamilyOptions<T, K>,
):
	| ReadonlyTransientSelectorFamilyToken<T, K>
	| WritableTransientSelectorFamilyToken<T, K> {
	return createSelectorFamily(IMPLICIT.STORE, options)
}
