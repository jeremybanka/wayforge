import type {
	Transceiver,
	TransceiverConstructor,
	TransceiverKit,
} from "atom.io/internal"
import {
	createMutableAtom,
	createMutableAtomFamily,
	createRegularAtom,
	createRegularAtomFamily,
	IMPLICIT,
} from "atom.io/internal"
import type { Canonical, Json, JsonInterface } from "atom.io/json"

import type { Setter } from "./set-state"
import type {
	MutableAtomFamilyToken,
	MutableAtomToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
} from "./tokens"

export type RegularAtomOptions<T> = {
	/** The unique identifier of the atom */
	key: string
	/** The starting value of the atom */
	default: T | (() => T)
	/** Hooks used to run side effects when the atom is set */
	effects?: AtomEffect<T>[]
}
/**
 * Create a regular atom, a global reactive variable in the implicit store
 * @param options - {@link RegularAtomOptions}.
 * @returns
 * A reference to the atom created: a {@link RegularAtomToken}
 */
export function atom<T>(options: RegularAtomOptions<T>): RegularAtomToken<T> {
	return createRegularAtom(IMPLICIT.STORE, options, undefined)
}

export type MutableAtomOptions<C extends TransceiverConstructor<any, any>> = {
	/** The unique identifier of the atom */
	key: string
	/** A constructor for the atom's value */
	class: C
	/** Hooks used to run side effects when the atom is set */
	effects?: AtomEffect<InstanceType<C>>[]
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
export function mutableAtom<C extends TransceiverConstructor<any, any>>(
	options: MutableAtomOptions<C>,
): MutableAtomToken<InstanceType<C>> {
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
	onSet: (callback: (options: { newValue: T; oldValue: T }) => void) => void
}

export type RegularAtomFamilyOptions<T, K extends Canonical> = {
	/** The unique identifier of the atom family */
	key: string
	/** The starting value of the atom family */
	default: T | ((key: K) => T)
	/** Hooks used to run side effects when an atom in the family is set  */
	effects?: (key: K) => AtomEffect<T>[]
}
/**
 * Create a family of regular atoms, allowing for the dynamic creation and disposal of atoms.
 * @param options - {@link RegularAtomFamilyOptions}
 * @returns
 * A reference to the atom family created: a {@link RegularAtomFamilyToken}
 */
export function atomFamily<T, K extends Canonical>(
	options: RegularAtomFamilyOptions<T, K>,
): RegularAtomFamilyToken<T, K> {
	return createRegularAtomFamily(IMPLICIT.STORE, options)
}

// biome-ignore format: intersection
export type MutableAtomFamilyOptions<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
> =
	& JsonInterface<T, J>
	& {
		/** The unique identifier of the atom family */
		key: string
		/** A function to create an initial value for each atom in the family */
		default: (key: K) => T
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
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
>(options: MutableAtomFamilyOptions<T, J, K>): MutableAtomFamilyToken<T, J, K> {
	return createMutableAtomFamily(IMPLICIT.STORE, options)
}
