import type { Transceiver } from "atom.io/internal"
import type { Canonical, Json, stringified } from "atom.io/json"

import type { AtomFamilyToken } from "./atom"
import type {
	SelectorFamilyToken,
	WritableSelectorFamilyToken,
} from "./selector"
import type { TimelineToken } from "./timeline"
import type { TransactionToken } from "./transaction"

export * from "./atom"
export * from "./dispose-state"
export * from "./find-state"
export * from "./get-state"
export * from "./join"
export * from "./logger"
export * from "./realm"
export * from "./reset-state"
export * from "./selector"
export * from "./set-state"
export * from "./silo"
export * from "./subscribe"
export * from "./timeline"
export * from "./transaction"
export * from "./validators"

/**
 * @public
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

/** @public */
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
/** @public */
export type MutableAtomToken<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical = any,
> = {
	/** The unique identifier of the atom. */
	key: string
	/** Discriminator. */
	type: `mutable_atom`
	/** Present if the atom belongs to a family. */
	family?: FamilyMetadata<K>
	/** Never present. This is a marker that preserves the JSON form of the atom's transceiver value. */
	__J?: J
	/** Never present. This is a marker that preserves the type of the atom's transceiver value. */
	__U?: T extends Transceiver<infer Update> ? Update : never
}
/** @public */
export type AtomToken<T, K extends Canonical = any> =
	| MutableAtomToken<T extends Transceiver<any> ? T : never, any, K>
	| RegularAtomToken<T, K>

/** @public */
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
/** @public */
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
/** @public */
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
/** @public */
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

/** @public */
export type PureSelectorToken<T, K extends Canonical = any> =
	| ReadonlyPureSelectorToken<T, K>
	| WritablePureSelectorToken<T, K>

/** @public */
export type HeldSelectorToken<T, K extends Canonical = any> =
	| ReadonlyHeldSelectorToken<T, K>
	| WritableHeldSelectorToken<T, K>

/** @public */
export type ReadonlySelectorToken<T, K extends Canonical = any> =
	| ReadonlyHeldSelectorToken<T, K>
	| ReadonlyPureSelectorToken<T, K>

/** @public */
export type WritableSelectorToken<T, K extends Canonical = any> =
	| WritableHeldSelectorToken<T, K>
	| WritablePureSelectorToken<T, K>

/** @public */
export type SelectorToken<T, K extends Canonical = any> =
	| ReadonlyHeldSelectorToken<T, K>
	| ReadonlyPureSelectorToken<T, K>
	| WritableHeldSelectorToken<T, K>
	| WritablePureSelectorToken<T, K>

/**
 * @public
 * These states can be set.
 */
export type WritableToken<T, K extends Canonical = any> =
	| AtomToken<T, K>
	| WritableSelectorToken<T, K>
/**
 * @public
 * These states cannot be set.
 */
export type ReadableToken<T, K extends Canonical = any> =
	| AtomToken<T, K>
	| SelectorToken<T, K>

/**
 * @public
 * States belonging to this family can be set.
 */
export type WritableFamilyToken<T, K extends Canonical> =
	| AtomFamilyToken<T, K>
	| WritableSelectorFamilyToken<T, K>
/**
 * @public
 * States belonging to this family cannot be set.
 */
export type ReadableFamilyToken<T, K extends Canonical> =
	| AtomFamilyToken<T, K>
	| SelectorFamilyToken<T, K>

/**
 * @public
 * Identifies a state's connection to its family.
 */
export type FamilyMetadata<K extends Canonical = any> = {
	/** The family's unique key. */
	key: string
	/** The family member's unique identifier, in the form of a string. */
	subKey: stringified<K>
}

/**
 * @public
 * Loadable is used to type atoms or selectors that may at some point be initialized to or set to a {@link Promise}.
 *
 * When a Promise is cached as the value of a state in atom.io, that state will be automatically set to the resolved value of the Promise when it is resolved.
 *
 * As a result, we consider any state that can be a set to a Promise to be a "loadable" state, whose value may or may not be a Promise at any given time.
 */
export type Loadable<T> = Promise<T> | T
