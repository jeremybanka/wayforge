import type { Transceiver } from "atom.io/internal"
import {
	createAtomFamily,
	createStandaloneAtom,
	IMPLICIT,
} from "atom.io/internal"
import type { Canonical, Json, JsonInterface } from "atom.io/json"

import type { AtomToken, MutableAtomToken, RegularAtomToken, Setter } from "."

/**
 * @public
 * Create a mutable atom, a global reactive variable in the implicit store
 *
 * The value of a mutable atom must be some kind of {@link Transceiver}.
 *
 * @param options - {@link MutableAtomOptions}.
 * @returns
 * A reference to the atom created: a {@link MutableAtomToken}
 * @overload Mutable
 */
export function atom<T extends Transceiver<any>, J extends Json.Serializable>(
	options: MutableAtomOptions<T, J>,
): MutableAtomToken<T, J>
/**
 * @public
 * Create a regular atom, a global reactive variable in the implicit store
 * @param options - {@link RegularAtomOptions}.
 * @returns
 * A reference to the atom created: a {@link RegularAtomToken}
 * @overload Regular
 */
export function atom<T>(options: RegularAtomOptions<T>): RegularAtomToken<T>
export function atom(
	options: MutableAtomOptions<any, any> | RegularAtomOptions<any>,
): AtomToken<any> {
	return createStandaloneAtom(IMPLICIT.STORE, options)
}

/** @public */
export type Effectors<T> = {
	/**
	 * Reset the value of the atom to its default
	 */
	resetSelf: () => void
	/**
	 * Set the value of the atom
	 * @param next - The new value of the atom, or a setter function
	 */
	setSelf: <New extends T>(next: New | Setter<T, New>) => void
	/** Subscribe to changes to the atom */
	onSet: (callback: (options: { newValue: T; oldValue: T }) => void) => void
}

/**
 * @public
 * A function that runs side effects when the atom is set
 * @param tools - {@link Effectors} that can be used to run side effects
 * @returns
 * Optionally, a cleanup function that will be called when the atom is disposed
 */
export type AtomEffect<T> = (tools: Effectors<T>) => (() => void) | void

/** @public */
export type RegularAtomOptions<T> = {
	/** The unique identifier of the atom */
	key: string
	/** The starting value of the atom */
	default: T | (() => T)
	/** Hooks used to run side effects when the atom is set */
	effects?: AtomEffect<T>[]
}

/** @public */
// biome-ignore format: intersection
export type MutableAtomOptions<
	T extends Transceiver<any>,
	J extends Json.Serializable,
> =
	& JsonInterface<T, J>
	& {
		/** Used to signal that the atom is mutable */
		mutable: true
		/** The unique identifier of the atom */
		key: string
		/** A function to create an initial value for the atom */
		default: () => T
		/** Hooks used to run side effects when the atom is set */
		effects?: AtomEffect<T>[]
	}

/** @public */
export type RegularAtomFamilyOptions<T, K extends Canonical> = {
	/** The unique identifier of the atom family */
	key: string
	/** The starting value of the atom family */
	default: T | ((key: K) => T)
	/** Hooks used to run side effects when an atom in the family is set  */
	effects?: (key: K) => AtomEffect<T>[]
}

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

/** @public */
// biome-ignore format: intersection
export type MutableAtomFamilyOptions<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
> =
	& JsonInterface<T, J>
	& {
		/** Used to signal that the atoms created from this family are mutable */
		mutable: true
		/** The unique identifier of the atom family */
		key: string
		/** A function to create an initial value for each atom in the family */
		default: (key: K) => T
		/** Hooks used to run side effects when an atom in the family is set  */
		effects?: (key: K) => AtomEffect<T>[]
	}

export type MutableAtomFamilyToken<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
> = {
	/** The unique identifier of the atom family */
	key: string
	/** Discriminator */
	type: `mutable_atom_family`
	/** Never present. This is a marker that preserves the type of atoms in this family */
	__T?: T
	/** Never present. This is a marker that preserves the type of the JSON form of atoms in this family */
	__J?: J
	/** Never present. This is a marker that preserves the type of keys used for atoms in this family */
	__K?: K
}
export type AtomFamilyToken<T, K extends Canonical = Canonical> =
	| MutableAtomFamilyToken<T extends Transceiver<any> ? T : never, any, K>
	| RegularAtomFamilyToken<T, K>

/**
 * @public
 * Create a family of mutable atoms, allowing for the dynamic creation and disposal of atoms.
 *
 * The value of a mutable atom must be some kind of {@link Transceiver}.
 *
 * @param options - {@link MutableAtomFamilyOptions}
 * @returns
 * A reference to the atom family created: a {@link MutableAtomFamilyToken}
 * @overload Mutable
 */
export function atomFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
>(options: MutableAtomFamilyOptions<T, J, K>): MutableAtomFamilyToken<T, J, K>
/**
 * @public
 * Create a family of regular atoms, allowing for the dynamic creation and disposal of atoms.
 * @param options - {@link RegularAtomFamilyOptions}
 * @returns
 * A reference to the atom family created: a {@link RegularAtomFamilyToken}
 * @overload Regular
 */
export function atomFamily<T, K extends Canonical>(
	options: RegularAtomFamilyOptions<T, K>,
): RegularAtomFamilyToken<T, K>
export function atomFamily<T, K extends Canonical>(
	options:
		| MutableAtomFamilyOptions<any, any, any>
		| RegularAtomFamilyOptions<T, K>,
): MutableAtomFamilyToken<any, any, any> | RegularAtomFamilyToken<T, K> {
	return createAtomFamily(IMPLICIT.STORE, options)
}
