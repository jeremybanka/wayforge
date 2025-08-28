import type { AsJSON, Fn, Transceiver } from "atom.io/internal"
import type { Canonical, stringified } from "atom.io/json"

/**
 * A token is an object that uniquely identifies a particular state, family, timeline, or transaction.
 *
 * While they represent one of these resources, they are not the resource itself. Think of them like paper currency representing money in the bank.
 *
 * Tokens are returned from resource creation functions, such as {@link atom} and {@link transaction}.
 *
 * Tokens can be used as parameters to functions that take a token, such as {@link getState}, {@link setState}, or {@link runTransaction}.
 *
 * Tokens are fully serializable, so they can be passed between processes.
 */
export type AtomIOToken =
	| ReadableFamilyToken<any, any, any>
	| ReadableToken<any, any, any>
	| TimelineToken<any>
	| TransactionToken<any>

export type ReadableToken<T, K extends Canonical = any, E = never> =
	| AtomToken<T, K, E>
	| SelectorToken<T, K, E>

export type WritableToken<T, K extends Canonical = any, E = never> =
	| AtomToken<T, K, E>
	| WritableSelectorToken<T, K, E>

/**
 * States belonging to this family can be read from the store.
 */
export type ReadableFamilyToken<T, K extends Canonical, E = never> =
	| AtomFamilyToken<T, K, E>
	| SelectorFamilyToken<T, K, E>
/**
 * States belonging to this family can be written directly.
 */
export type WritableFamilyToken<T, K extends Canonical, E = never> =
	| AtomFamilyToken<T, K, E>
	| WritableSelectorFamilyToken<T, K, E>

export type TimelineToken<M> = {
	/** The unique identifier of the timeline */
	key: string
	/** Discriminator */
	type: `timeline`
	/** Never present. This is a marker that preserves the type of the managed atoms */
	__M?: M
}

export type TransactionToken<F extends Fn> = {
	/** The unique identifier of the transaction */
	key: string
	/** Discriminator */
	type: `transaction`
	/** Never present. This is a marker that preserves the type of the transaction function */
	__F?: F
}

export type AtomToken<T, K extends Canonical = any, E = never> =
	| MutableAtomToken<T extends Transceiver<any, any, any> ? T : never, K>
	| RegularAtomToken<T, K, E>
export type RegularAtomToken<T, K extends Canonical = any, E = never> = {
	/** The unique identifier of the atom. */
	key: string
	/** Discriminator. */
	type: `atom`
	/** Present if the atom belongs to a family. */
	family?: FamilyMetadata<K>
	/** Never present. This is a marker that preserves the type of the atom's value. */
	__T?: T
	/** Never present. This is a marker that preserves the type of errors this atom is capable of catching and setting as its value. */
	__E?: E
}
export type MutableAtomToken<
	T extends Transceiver<any, any, any>,
	K extends Canonical = any,
> = {
	/** The unique identifier of the atom. */
	key: string
	/** Discriminator. */
	type: `mutable_atom`
	/** Present if the atom belongs to a family. */
	family?: FamilyMetadata<K>
	/** Never present. This is a marker that preserves the JSON form of the atom's transceiver value. */
	__J?: AsJSON<T>
}

export type SelectorToken<T, K extends Canonical = any, E = never> =
	| ReadonlySelectorToken<T, K, E>
	| WritableSelectorToken<T, K, E>
export type ReadonlySelectorToken<T, K extends Canonical = any, E = never> =
	| ReadonlyHeldSelectorToken<T, K>
	| ReadonlyPureSelectorToken<T, K, E>
export type WritableSelectorToken<T, K extends Canonical = any, E = never> =
	| WritableHeldSelectorToken<T, K>
	| WritablePureSelectorToken<T, K, E>
export type PureSelectorToken<T, K extends Canonical = any, E = never> =
	| ReadonlyPureSelectorToken<T, K, E>
	| WritablePureSelectorToken<T, K, E>
export type HeldSelectorToken<T, K extends Canonical = any> =
	| ReadonlyHeldSelectorToken<T, K>
	| WritableHeldSelectorToken<T, K>

export type WritablePureSelectorToken<
	T,
	K extends Canonical = any,
	E = never,
> = {
	/** The unique identifier of the selector. */
	key: string
	/** Discriminator. */
	type: `writable_pure_selector`
	/** Present if the selector belongs to a family. */
	family?: FamilyMetadata<K>
	/** Never present. This is a marker that preserves the type of the selector's value. */
	__T?: T
	/** Never present. This is a marker that preserves the type of errors this selector is capable of catching and setting as its value. */
	__E?: E
}
export type WritableHeldSelectorToken<T, K extends Canonical = any> = {
	/** The unique identifier of the selector. */
	key: string
	/** Discriminator. */
	type: `writable_held_selector`
	/** Present if the selector belongs to a family. */
	family?: FamilyMetadata<K>
	/** Never present. This is a marker that preserves the type of the selector's value. */
	__T?: T
}
export type ReadonlyPureSelectorToken<
	T,
	K extends Canonical = any,
	E = never,
> = {
	/** The unique identifier of the selector. */
	key: string
	/** Discriminator. */
	type: `readonly_pure_selector`
	/** Present if the selector belongs to a family. */
	family?: FamilyMetadata<K>
	/** Never present. This is a marker that preserves the type of the selector's value. */
	__T?: T
	/** Never present. This is a marker that preserves the type of errors this selector is capable of catching and setting as its value. */
	__E?: E
}
export type ReadonlyHeldSelectorToken<T, K extends Canonical = any> = {
	/** The unique identifier of the selector. */
	key: string
	/** Discriminator. */
	type: `readonly_held_selector`
	/** Present if the selector belongs to a family. */
	family?: FamilyMetadata<K>
	/** Never present. This is a marker that preserves the type of the selector's value. */
	__T?: T
}

/**
 * Identifies a state's connection to its family.
 */
export type FamilyMetadata<K extends Canonical = any> = {
	/** The family's unique key. */
	key: string
	/** The family member's unique identifier, in the form of a string. */
	subKey: stringified<K>
}

export type AtomFamilyToken<T, K extends Canonical = Canonical, E = never> =
	| MutableAtomFamilyToken<T extends Transceiver<any, any, any> ? T : never, K>
	| RegularAtomFamilyToken<T, K, E>
export type RegularAtomFamilyToken<T, K extends Canonical, E = never> = {
	/** The unique identifier of the atom family */
	key: string
	/** Discriminator */
	type: `atom_family`
	/** Never present. This is a marker that preserves the type of atoms in this family */
	__T?: T
	/** Never present. This is a marker that preserves the type of keys used for atoms in this family */
	__K?: K
	/** Never present. This is a marker that preserves the type of errors this family is capable of catching and setting as its value. */
	__E?: E
}
export type MutableAtomFamilyToken<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
> = {
	/** The unique identifier of the atom family */
	key: string
	/** Discriminator */
	type: `mutable_atom_family`
	/** Never present. This is a marker that preserves the type of atoms in this family */
	__T?: T
	/** Never present. This is a marker that preserves the type of keys used for atoms in this family */
	__K?: K
}

export type SelectorFamilyToken<T, K extends Canonical, E = never> =
	| ReadonlySelectorFamilyToken<T, K, E>
	| WritableSelectorFamilyToken<T, K, E>
export type ReadonlySelectorFamilyToken<T, K extends Canonical, E = never> =
	| ReadonlyHeldSelectorFamilyToken<T, K>
	| ReadonlyPureSelectorFamilyToken<T, K, E>
export type WritableSelectorFamilyToken<T, K extends Canonical, E = never> =
	| WritableHeldSelectorFamilyToken<T, K>
	| WritablePureSelectorFamilyToken<T, K, E>
export type PureSelectorFamilyToken<T, K extends Canonical, E = never> =
	| ReadonlyPureSelectorFamilyToken<T, K, E>
	| WritablePureSelectorFamilyToken<T, K, E>
export type HeldSelectorFamilyToken<T, K extends Canonical> =
	| ReadonlyHeldSelectorFamilyToken<T, K>
	| WritableHeldSelectorFamilyToken<T, K>

export type WritablePureSelectorFamilyToken<
	T,
	K extends Canonical,
	E = never,
> = {
	/** The unique identifier of the family */
	key: string
	/** Discriminator */
	type: `writable_pure_selector_family`
	/** Never present. This is a marker that preserves the type of the value of each family member */
	__T?: T
	/** Never present. This is a marker that preserves the type of keys used for each family member */
	__K?: K
	/** Never present. This is a marker that preserves the type of errors this family is capable of catching and setting as its value. */
	__E?: E
}
export type ReadonlyPureSelectorFamilyToken<
	T,
	K extends Canonical,
	E = never,
> = {
	/** The unique identifier of the family */
	key: string
	/** Discriminator */
	type: `readonly_pure_selector_family`
	/** Never present. This is a marker that preserves the type of the value of each family member */
	__T?: T
	/** Never present. This is a marker that preserves the type of keys used for each family member */
	__K?: K
	/** Never present. This is a marker that preserves the type of errors this family is capable of catching and setting as its value. */
	__E?: E
}
export type WritableHeldSelectorFamilyToken<T, K extends Canonical> = {
	/** The unique identifier of the family */
	key: string
	/** Discriminator */
	type: `writable_held_selector_family`
	/** Never present. This is a marker that preserves the type of the value of each family member */
	__T?: T
	/** Never present. This is a marker that preserves the type of keys used for each family member */
	__K?: K
}
export type ReadonlyHeldSelectorFamilyToken<T, K extends Canonical> = {
	/** The unique identifier of the family */
	key: string
	/** Discriminator */
	type: `readonly_held_selector_family`
	/** Never present. This is a marker that preserves the type of the value of each family member */
	__T?: T
	/** Never present. This is a marker that preserves the type of keys used for each family member */
	__K?: K
}
