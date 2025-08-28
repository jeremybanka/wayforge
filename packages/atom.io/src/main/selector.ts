import {
	createSelectorFamily,
	createStandaloneSelector,
	IMPLICIT,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type {
	ReadonlyHeldSelectorFamilyToken,
	ReadonlyHeldSelectorToken,
	ReadonlyPureSelectorFamilyToken,
	ReadonlyPureSelectorToken,
	WritableHeldSelectorFamilyToken,
	WritableHeldSelectorToken,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
} from "./tokens"
import type { Read, Write } from "./transaction"

export type WritablePureSelectorOptions<T, E = never> = {
	/** The unique identifier of the selector */
	key: string
	/** For each instantiated selector, a function that computes its value */
	get: Read<() => T>
	/** For each instantiated selector, a function that sets its value */
	set: Write<(newValue: T) => void>
	/** The classes of errors that might be thrown when deriving the atom's default value */
	catch?: readonly (new () => E)[]
}
export type ReadonlyPureSelectorOptions<T, E = never> = {
	/** The unique identifier of the selector */
	key: string
	/** For each instantiated selector, a function that computes its value */
	get: Read<() => T>
	/** The classes of errors that might be thrown when deriving the atom's default value */
	catch?: readonly (new () => E)[]
}
export type ReadonlyHeldSelectorOptions<T extends object> = {
	/** The unique identifier of the selector */
	key: string
	/** For each instantiated selector, a constant reference to a value that will not be replaced */
	const: T
	/** For each instantiated selector, a function that computes its value */
	get: Read<(permanent: T) => void>
}
export type WritableHeldSelectorOptions<T extends object> = {
	/** The unique identifier of the selector */
	key: string
	/** For each instantiated selector, a constant reference to a value that will not be replaced */
	const: T
	/** For each instantiated selector, a function that computes its value */
	get: Read<(permanent: T) => void>
	/** For each instantiated selector, a function that sets its value */
	set: Write<(newValue: T) => void>
}

/**
 * Declare a selector. The value of a selector should depend
 * on the value of atoms or other selectors in the store, and
 * should be recycled when a root atom of the selector is set.
 *
 * A held selector's value must be some object.
 * The reference to that object is permanent and will not be replaced.
 *
 * A writable selector can be "set" to a new value.
 * It is strongly advised to set its dependencies to values
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
 * Declare a selector. The value of a selector should depend
 * on the value of atoms or other selectors in the store.
 *
 * A pure selector's current value is evicted from the store
 * in order to be garbage collected when a root atom of the selector is set.
 *
 * A writable selector can be "set" to a new value.
 * It is strongly advised to set its dependencies to values
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

export type WritablePureSelectorFamilyOptions<
	T,
	K extends Canonical,
	E = never,
> = {
	/** The unique identifier of the family */
	key: string
	/** For each instantiated family member, a function that computes its value */
	get: (key: K) => Read<() => T>
	/** For each instantiated family member, a function that sets its value */
	set: (key: K) => Write<(newValue: T) => void>
	/** The classes of errors that might be thrown when deriving the atom's default value */
	catch?: readonly (new () => E)[]
}
export type ReadonlyPureSelectorFamilyOptions<
	T,
	K extends Canonical,
	E = never,
> = {
	/** The unique identifier of the family */
	key: string
	/** For each instantiated family member, a function that computes its value */
	get: (key: K) => Read<() => T>
	/** The classes of errors that might be thrown when deriving the atom's default value */
	catch?: readonly (new () => E)[]
}
export type WritableHeldSelectorFamilyOptions<
	T extends object,
	K extends Canonical,
> = {
	/** The unique identifier of the family */
	key: string
	/** For each instantiated family member, a constant reference to a value that will not be replaced */
	const: (key: K) => T
	/** For each instantiated family member, a function that computes its value */
	get: (key: K) => Read<(permanent: T) => void>
	/** For each instantiated family member, a function that sets its value */
	set: (key: K) => Write<(newValue: T) => void>
}
export type ReadonlyHeldSelectorFamilyOptions<
	T extends object,
	K extends Canonical,
> = {
	/** The unique identifier of the family */
	key: string
	/** For each instantiated family member, a constant reference to a value that will not be replaced */
	const: (key: K) => T
	/** For each instantiated family member, a function that computes its value */
	get: (key: K) => Read<(permanent: T) => void>
}

/**
 * Create a family of selectors, allowing for the dynamic creation and disposal of selectors.
 *
 * The value of a held selector should depend on the value of atoms or other selectors in the store,
 * and should be recycled when a root atom of the selector is set.
 *
 * A held selector's value must be some object.
 * The reference to that object is permanent and will not be replaced.
 *
 * A writable selector can be "set" to a new value.
 * It is advised to set its dependencies to values
 * that would produce the new value of the selector.
 *
 * @param options - {@link WritableHeldSelectorFamilyOptions}.
 * @returns
 * A reference to the selector family created: a {@link WritableHeldSelectorFamilyToken}
 * @overload WritableHeld
 */
export function selectorFamily<T extends object, K extends Canonical>(
	options: WritableHeldSelectorFamilyOptions<T, K>,
): WritableHeldSelectorFamilyToken<T, K>
/**
 * Create a family of selectors, allowing for the dynamic creation and disposal of selectors.
 *
 * The value of a held selector should depend on the value of atoms or other selectors in the store,
 * and should be recycled when a root atom of the selector is set.
 *
 * A held selector's value must be some object.
 * The reference to that object is permanent and will not be replaced.
 *
 * A readonly selector can be "gotten" but not "set".
 *
 * @param options - {@link ReadonlyHeldSelectorFamilyOptions}.
 * @returns
 * A reference to the selector family created: a {@link ReadonlyHeldSelectorFamilyToken}
 * @overload ReadonlyHeld
 */
export function selectorFamily<T extends object, K extends Canonical>(
	options: ReadonlyHeldSelectorFamilyOptions<T, K>,
): ReadonlyHeldSelectorFamilyToken<T, K>
/**
 * Create a family of selectors, allowing for the dynamic creation and disposal of selectors.
 *
 * The value of a selector should depend on the value of atoms or other selectors in the store.
 *
 * A pure selector's current value is evicted from the store
 * in order to be garbage collected when a root atom of the selector is set.
 *
 * A writable selector can be "set" to a new value.
 * It is advised to set its dependencies to values
 * that would produce the new value of the selector.
 *
 * @param options - {@link TransientWritableSelectorFamilyOptions}.
 * @returns
 * A reference to the selector family created: a {@link TransientWritableSelectorFamilyToken}
 * @overload WritablePure
 */
export function selectorFamily<T, K extends Canonical>(
	options: WritablePureSelectorFamilyOptions<T, K>,
): WritablePureSelectorFamilyToken<T, K>
/**
 * Create a family of selectors, allowing for the dynamic creation and disposal of selectors.
 *
 * The value of a selector should depend on the value of atoms or other selectors in the store.
 *
 * A pure selector's current value is evicted from the store
 * in order to be garbage collected when a root atom of the selector is set.
 *
 * A readonly selector can be "gotten" but not "set".
 *
 * @param options - {@link ReadonlyPureSelectorFamilyOptions}.
 * @returns
 * A reference to the selector family created: a {@link ReadonlyPureSelectorFamilyToken}
 * @overload ReadonlyPure
 */
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
