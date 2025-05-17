import {
	createSelectorFamily,
	createStandaloneSelector,
	IMPLICIT,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type {
	ReadonlyHeldSelectorToken,
	ReadonlyPureSelectorToken,
	WritableHeldSelectorToken,
	WritablePureSelectorToken,
} from "."
import type { Read, Write } from "./transaction"

export type WritablePureSelectorOptions<T> = {
	key: string
	get: Read<() => T>
	set: Write<(newValue: T) => void>
}
export type ReadonlyPureSelectorOptions<T> = {
	key: string
	get: Read<() => T>
}
export type ReadonlyHeldSelectorOptions<T extends object> = {
	key: string
	const: T
	get: Read<(permanent: T) => void>
}
export type WritableHeldSelectorOptions<T extends object> = {
	key: string
	const: T
	get: Read<(permanent: T) => void>
	set: Write<(newValue: T) => void>
}

/**
 * @public
 * Declare a selector. The value of a selector should depend
 * on the value of atoms or other selectors in the store, and
 * should be recycled when a root atom of the selector is set.
 *
 * A held selector's value must be some object.
 * The reference to that object is permanent and will not be replaced.
 *
 * A writable selector can be "set" to a new value.
 * It is advised to set its dependencies to values
 * that would produce the new value of the selector.
 *
 * @param options - {@link WritableHeldSelectorOptions}.
 * @returns
 * The token for your selector.
 * @overload WritableHeld
 */
export function selector<T extends object>(
	options: WritableHeldSelectorOptions<T>,
): WritableHeldSelectorToken<T>

/**
 * @public
 * Declare a selector. The value of a selector should depend
 * on the value of atoms or other selectors in the store,
 * and should be recycled when a root atom of the selector is set.
 *
 * A held selector's value must be some object.
 * The reference to that object is permanent and will not be replaced.
 *
 * A readonly selector can be "gotten" but not "set".
 *
 * @param options - {@link ReadonlyHeldSelectorOptions}.
 * @returns
 * The token for your selector.
 * @overload ReadonlyHeld
 */
export function selector<T extends object>(
	options: ReadonlyHeldSelectorOptions<T>,
): ReadonlyHeldSelectorToken<T>

/**
 * @public
 * Declare a selector. The value of a selector should depend
 * on the value of atoms or other selectors in the store.
 *
 * A pure selector's current value is evicted from the store
 * in order to be garbage collected when a root atom of the selector is set.
 *
 * A writable selector can be "set" to a new value.
 * It is advised to set its dependencies to values
 * that would produce the new value of the selector.
 *
 * @param options - {@link TransientWritableSelectorOptions}.
 * @returns
 * The token for your selector.
 * @overload WritablePure
 */
export function selector<T>(
	options: WritablePureSelectorOptions<T>,
): WritablePureSelectorToken<T>

/**
 * @public
 * Declare a selector. The value of a selector should depend
 * on the value of atoms or other selectors in the store.
 *
 * A pure selector's current value is evicted from the store
 * in order to be garbage collected when a root atom of the selector is set.
 *
 * A readonly selector can be "gotten" but not "set".
 *
 * @param options - {@link ReadonlyPureSelectorOptions}.
 * @returns
 * The token for your selector.
 * @overload ReadonlyPure
 */
export function selector<T>(
	options: ReadonlyPureSelectorOptions<T>,
): ReadonlyPureSelectorToken<T>

export function selector(
	options:
		| ReadonlyHeldSelectorOptions<any>
		| ReadonlyPureSelectorOptions<any>
		| WritableHeldSelectorOptions<any>
		| WritablePureSelectorOptions<any>,
):
	| ReadonlyHeldSelectorToken<any>
	| ReadonlyPureSelectorToken<any>
	| WritableHeldSelectorToken<any>
	| WritablePureSelectorToken<any> {
	return createStandaloneSelector(IMPLICIT.STORE, options)
}

export type WritablePureSelectorFamilyOptions<T, K extends Canonical> = {
	key: string
	get: (key: K) => Read<() => T>
	set: (key: K) => Write<(newValue: T) => void>
}
export type ReadonlyPureSelectorFamilyOptions<T, K extends Canonical> = {
	key: string
	get: (key: K) => Read<() => T>
}
export type WritableHeldSelectorFamilyOptions<
	T extends object,
	K extends Canonical,
> = {
	key: string
	const: (key: K) => T
	get: (key: K) => Read<(permanent: T) => void>
	set: (key: K) => Write<(newValue: T) => void>
}
export type ReadonlyHeldSelectorFamilyOptions<
	T extends object,
	K extends Canonical,
> = {
	key: string
	const: (key: K) => T
	get: (key: K) => Read<(permanent: T) => void>
}

export type WritablePureSelectorFamilyToken<T, K extends Canonical> = {
	key: string
	type: `writable_pure_selector_family`
	__T?: T
	__K?: K
}
export type ReadonlyPureSelectorFamilyToken<T, K extends Canonical> = {
	key: string
	type: `readonly_pure_selector_family`
	__T?: T
	__K?: K
}
export type WritableHeldSelectorFamilyToken<T, K extends Canonical> = {
	key: string
	type: `writable_held_selector_family`
	__T?: T
	__K?: K
}
export type ReadonlyHeldSelectorFamilyToken<T, K extends Canonical> = {
	key: string
	type: `readonly_held_selector_family`
	__T?: T
	__K?: K
}

export type PureSelectorFamilyToken<T, K extends Canonical> =
	| ReadonlyPureSelectorFamilyToken<T, K>
	| WritablePureSelectorFamilyToken<T, K>
export type HeldSelectorFamilyToken<T, K extends Canonical> =
	| ReadonlyHeldSelectorFamilyToken<T, K>
	| WritableHeldSelectorFamilyToken<T, K>
export type ReadonlySelectorFamilyToken<T, K extends Canonical> =
	| ReadonlyHeldSelectorFamilyToken<T, K>
	| ReadonlyPureSelectorFamilyToken<T, K>

export type WritableSelectorFamilyToken<T, K extends Canonical> =
	| WritableHeldSelectorFamilyToken<T, K>
	| WritablePureSelectorFamilyToken<T, K>

export type SelectorFamilyToken<T, K extends Canonical> =
	| HeldSelectorFamilyToken<T, K>
	| PureSelectorFamilyToken<T, K>

export function selectorFamily<T extends object, K extends Canonical>(
	options: WritableHeldSelectorFamilyOptions<T, K>,
): WritableHeldSelectorFamilyToken<T, K>
export function selectorFamily<T extends object, K extends Canonical>(
	options: ReadonlyHeldSelectorFamilyOptions<T, K>,
): ReadonlyHeldSelectorFamilyToken<T, K>
export function selectorFamily<T, K extends Canonical>(
	options: WritablePureSelectorFamilyOptions<T, K>,
): WritablePureSelectorFamilyToken<T, K>
export function selectorFamily<T, K extends Canonical>(
	options: ReadonlyPureSelectorFamilyOptions<T, K>,
): ReadonlyPureSelectorFamilyToken<T, K>
export function selectorFamily(
	options:
		| ReadonlyHeldSelectorFamilyOptions<any, any>
		| ReadonlyPureSelectorFamilyOptions<any, any>
		| WritableHeldSelectorFamilyOptions<any, any>
		| WritablePureSelectorFamilyOptions<any, any>,
):
	| ReadonlyHeldSelectorFamilyToken<any, any>
	| ReadonlyPureSelectorFamilyToken<any, any>
	| WritableHeldSelectorFamilyToken<any, any>
	| WritablePureSelectorFamilyToken<any, any> {
	return createSelectorFamily(IMPLICIT.STORE, options)
}
