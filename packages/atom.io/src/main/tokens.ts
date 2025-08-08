import type { Func, AsJSON, Transceiver } from "atom.io/internal"
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
	| ReadableFamilyToken<any, any>
	| ReadableToken<any>
	| TimelineToken<any>
	| TransactionToken<any>

/**
 * These states cannot be set.
 */
export type ReadableToken<T, K extends Canonical = any> =
	| AtomToken<T, K>
	| SelectorToken<T, K>
/**
 * These states can be set.
 */
export type WritableToken<T, K extends Canonical = any> =
	| AtomToken<T, K>
	| WritableSelectorToken<T, K>

/**
 * States belonging to this family can be gotten from the store.
 */
export type ReadableFamilyToken<T, K extends Canonical> =
	| AtomFamilyToken<T, K>
	| SelectorFamilyToken<T, K>
/**
 * States belonging to this family can be set.
 */
export type WritableFamilyToken<T, K extends Canonical> =
	| AtomFamilyToken<T, K>
	| WritableSelectorFamilyToken<T, K>

export type TimelineToken<M> = {
	/** The unique identifier of the timeline */
	key: string
	/** Discriminator */
	type: `timeline`
	/** Never present. This is a marker that preserves the type of the managed atoms */
	__M?: M
}

export type TransactionToken<F extends Func> = {
	/** The unique identifier of the transaction */
	key: string
	/** Discriminator */
	type: `transaction`
	/** Never present. This is a marker that preserves the type of the transaction function */
	__F?: F
}

export type AtomToken<T, K extends Canonical = any> =
	| MutableAtomToken<T extends Transceiver<any, any> ? T : never, K>
	| RegularAtomToken<T, K>
export type RegularAtomToken<T, K extends Canonical = any> = {
	/** The unique identifier of the atom. */
	key: string
	/** Discriminator. */
	type: `atom`
	/** Present if the atom belongs to a family. */
	family?: FamilyMetadata<K>
	/** Never present. This is a marker that preserves the type of the atom's value. */
	__T?: T
}
export type MutableAtomToken<
	T extends Transceiver<any, any>,
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
	/** Never present. This is a marker that preserves the type of the atom's transceiver value. */
	__U?: T extends Transceiver<infer Update, any> ? Update : never
}

export type SelectorToken<T, K extends Canonical = any> =
	| ReadonlySelectorToken<T, K>
	| WritableSelectorToken<T, K>
export type ReadonlySelectorToken<T, K extends Canonical = any> =
	| ReadonlyHeldSelectorToken<T, K>
	| ReadonlyPureSelectorToken<T, K>
export type WritableSelectorToken<T, K extends Canonical = any> =
	| WritableHeldSelectorToken<T, K>
	| WritablePureSelectorToken<T, K>
export type PureSelectorToken<T, K extends Canonical = any> =
	| ReadonlyPureSelectorToken<T, K>
	| WritablePureSelectorToken<T, K>
export type HeldSelectorToken<T, K extends Canonical = any> =
	| ReadonlyHeldSelectorToken<T, K>
	| WritableHeldSelectorToken<T, K>

export type WritablePureSelectorToken<T, K extends Canonical = any> = {
	/** The unique identifier of the selector. */
	key: string
	/** Discriminator. */
	type: `writable_pure_selector`
	/** Present if the selector belongs to a family. */
	family?: FamilyMetadata<K>
	/** Never present. This is a marker that preserves the type of the selector's value. */
	__T?: T
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
export type ReadonlyPureSelectorToken<T, K extends Canonical = any> = {
	/** The unique identifier of the selector. */
	key: string
	/** Discriminator. */
	type: `readonly_pure_selector`
	/** Present if the selector belongs to a family. */
	family?: FamilyMetadata<K>
	/** Never present. This is a marker that preserves the type of the selector's value. */
	__T?: T
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

export type AtomFamilyToken<T, K extends Canonical = Canonical> =
	| MutableAtomFamilyToken<T extends Transceiver<any, any> ? T : never, K>
	| RegularAtomFamilyToken<T, K>
export type RegularAtomFamilyToken<T, K extends Canonical> = {
	/** The unique identifier of the atom family */
	key: string
	/** Discriminator */
	type: `atom_family`
	/** Never present. This is a marker that preserves the type of atoms in this family */
	__T?: T
	/** Never present. This is a marker that preserves the type of keys used for atoms in this family */
	__K?: K
}
export type MutableAtomFamilyToken<
	T extends Transceiver<any, any>,
	K extends Canonical,
> = {
	/** The unique identifier of the atom family */
	key: string
	/** Discriminator */
	type: `mutable_atom_family`
	/** Never present. This is a marker that preserves the type of atoms in this family */
	__T?: T
	/** Never present. This is a marker that preserves the type of the JSON form of atoms in this family */
	__J?: AsJSON<T>
	/** Never present. This is a marker that preserves the type of keys used for atoms in this family */
	__K?: K
}

export type SelectorFamilyToken<T, K extends Canonical> =
	| ReadonlySelectorFamilyToken<T, K>
	| WritableSelectorFamilyToken<T, K>
export type ReadonlySelectorFamilyToken<T, K extends Canonical> =
	| ReadonlyHeldSelectorFamilyToken<T, K>
	| ReadonlyPureSelectorFamilyToken<T, K>
export type WritableSelectorFamilyToken<T, K extends Canonical> =
	| WritableHeldSelectorFamilyToken<T, K>
	| WritablePureSelectorFamilyToken<T, K>
export type PureSelectorFamilyToken<T, K extends Canonical> =
	| ReadonlyPureSelectorFamilyToken<T, K>
	| WritablePureSelectorFamilyToken<T, K>
export type HeldSelectorFamilyToken<T, K extends Canonical> =
	| ReadonlyHeldSelectorFamilyToken<T, K>
	| WritableHeldSelectorFamilyToken<T, K>

export type WritablePureSelectorFamilyToken<T, K extends Canonical> = {
	/** The unique identifier of the family */
	key: string
	/** Discriminator */
	type: `writable_pure_selector_family`
	/** Never present. This is a marker that preserves the type of the value of each family member */
	__T?: T
	/** Never present. This is a marker that preserves the type of keys used for each family member */
	__K?: K
}
export type ReadonlyPureSelectorFamilyToken<T, K extends Canonical> = {
	/** The unique identifier of the family */
	key: string
	/** Discriminator */
	type: `readonly_pure_selector_family`
	/** Never present. This is a marker that preserves the type of the value of each family member */
	__T?: T
	/** Never present. This is a marker that preserves the type of keys used for each family member */
	__K?: K
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
