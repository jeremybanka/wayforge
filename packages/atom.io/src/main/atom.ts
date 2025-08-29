import type { ConstructorOf, Ctor, Transceiver } from "atom.io/internal"
import {
	createMutableAtom,
	createMutableAtomFamily,
	createRegularAtom,
	createRegularAtomFamily,
	IMPLICIT,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type { StateUpdate } from "./events"
import type { Setter } from "./set-state"
import type {
	MutableAtomFamilyToken,
	MutableAtomToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
} from "./tokens"

export type RegularAtomOptions<T, E = never> = {
	/** The unique identifier of the atom */
	key: string
	/** The starting value of the atom */
	default: T | (() => T)
	/** Hooks used to run side effects when the atom is set */
	effects?: readonly AtomEffect<T>[]
	/** The classes of errors that might be thrown when deriving the atom's default value */
	catch?: readonly Ctor<E>[]
}
/**
 * Create a regular atom, a global reactive variable in the implicit store
 * @param options - {@link RegularAtomOptions}.
 * @returns
 * A reference to the atom created: a {@link RegularAtomToken}
 */
export function atom<T, E = never>(
	options: RegularAtomOptions<T, E>,
): RegularAtomToken<T, any, E> {
	return createRegularAtom(IMPLICIT.STORE, options, undefined)
}

export type MutableAtomOptions<T extends Transceiver<any, any, any>> = {
	/** The unique identifier of the atom */
	key: string
	/** A constructor for the atom's value */
	class: ConstructorOf<T>
	/** Hooks used to run side effects when the atom is set */
	effects?: readonly AtomEffect<T>[]
}
/**
 * Create a mutable atom, a global reactive variable in the implicit store
 *
 * The value of a mutable atom must be some kind of {@link Transceiver}.
 *
 * @param options - {@link MutableAtomOptions}.
 * @returns
 * A reference to the atom created: a {@link MutableAtomToken}
 */
export function mutableAtom<T extends Transceiver<any, any, any>>(
	options: MutableAtomOptions<T>,
): MutableAtomToken<T> {
	return createMutableAtom(IMPLICIT.STORE, options, undefined)
}

/**
 * A function that runs side effects when the atom is set
 * @param tools - {@link Effectors} that can be used to run side effects
 * @returns
 * Optionally, a cleanup function that will be called when the atom is disposed
 */
export type AtomEffect<T> = (tools: Effectors<T>) => (() => void) | void
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
	onSet: (callback: (options: StateUpdate<T>) => void) => void
}

export type RegularAtomFamilyOptions<T, K extends Canonical, E = never> = {
	/** The unique identifier of the atom family */
	key: string
	/** The starting value of the atom family */
	default: T | ((key: K) => T)
	/** Hooks used to run side effects when an atom in the family is set  */
	effects?: (key: K) => AtomEffect<T>[]
	/** The classes of errors that might be thrown when deriving the atom's default value */
	catch?: readonly Ctor<E>[]
}
/**
 * Create a family of regular atoms, allowing for the dynamic creation and disposal of atoms.
 * @param options - {@link RegularAtomFamilyOptions}
 * @returns
 * A reference to the atom family created: a {@link RegularAtomFamilyToken}
 */
export function atomFamily<T, K extends Canonical, E = never>(
	options: RegularAtomFamilyOptions<T, K, E>,
): RegularAtomFamilyToken<T, K, E> {
	return createRegularAtomFamily(IMPLICIT.STORE, options)
}

export type MutableAtomFamilyOptions<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
> = {
	/** The unique identifier of the atom family */
	key: string
	/** The class of the transceiver to be created */
	class: ConstructorOf<T>
	/** Hooks used to run side effects when an atom in the family is set  */
	effects?: (key: K) => AtomEffect<T>[]
}
/**
 * Create a family of mutable atoms, allowing for the dynamic creation and disposal of atoms.
 *
 * The value of a mutable atom must be some kind of {@link Transceiver}.
 *
 * @param options - {@link MutableAtomFamilyOptions}
 * @returns
 * A reference to the atom family created: a {@link MutableAtomFamilyToken}
 */
export function mutableAtomFamily<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
>(options: MutableAtomFamilyOptions<T, K>): MutableAtomFamilyToken<T, K> {
	return createMutableAtomFamily(IMPLICIT.STORE, options)
}
