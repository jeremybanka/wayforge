import type { Store, Subject, Transceiver } from "atom.io/internal"
import {
	createAtomFamily,
	createStandaloneAtom,
	IMPLICIT,
} from "atom.io/internal"
import type { Canonical, Json, JsonInterface } from "atom.io/json"

import type {
	AtomToken,
	MutableAtomToken,
	RegularAtomToken,
	StateCreation,
	StateDisposal,
} from "."

export type Effectors<T> = {
	setSelf: <V extends T>(next: V | ((oldValue: T) => V)) => void
	onSet: (callback: (options: { newValue: T; oldValue: T }) => void) => void
}

export type AtomEffect<T> = (tools: Effectors<T>) => (() => void) | void

export type RegularAtomOptions<T> = {
	key: string
	default: T | (() => T)
	effects?: AtomEffect<T>[]
}
// biome-ignore format: complex intersection
export type MutableAtomOptions<T extends Transceiver<any>, J extends Json.Serializable> = 
	& JsonInterface<T, J>
	& Omit<RegularAtomOptions<T>, `default`> 
	& { 
			default: ()	=> T
			mutable: true
		}

/**
 * @public
 * Declare a mutable global reactive variable.
 * @param options - Configuration for this mutable atom.
 * @returns
 * The token for your mutable atom.
 * @overload Mutable
 */
export function atom<T extends Transceiver<any>, J extends Json.Serializable>(
	options: MutableAtomOptions<T, J>,
): MutableAtomToken<T, J>
/**
 * @public
 * Declare a regular global reactive variable.
 * @param options - Configuration for this regular atom.
 * @returns
 * The token for your regular atom.
 * @overload Regular
 */
export function atom<T>(options: RegularAtomOptions<T>): RegularAtomToken<T>

export function atom(
	options: MutableAtomOptions<any, any> | RegularAtomOptions<any>,
): AtomToken<any> {
	return createStandaloneAtom(options, IMPLICIT.STORE)
}

export type RegularAtomFamilyOptions<T, K extends Canonical> = {
	key: string
	default: T | ((key: K) => T)
	effects?: (key: K) => AtomEffect<T>[]
}

export type RegularAtomFamilyToken<T, K extends Canonical> = {
	key: string
	type: `atom_family`
	__T?: T
	__K?: K
}
// biome-ignore format: intersection
export type RegularAtomFamily<T, K extends Canonical> = 
	& RegularAtomFamilyToken<T, K>
	& {
		(key: K): RegularAtomToken<T>
		subject: Subject<StateCreation<AtomToken<T>> | StateDisposal<AtomToken<T>>>
		install: (store: Store) => void
	}

// biome-ignore format: intersection
export type MutableAtomFamilyOptions<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
> = 
	& JsonInterface<T, J>
	& { 
		key: string
		default: (key: K) => T
		effects?: (key: K) => AtomEffect<T>[]
		mutable: true,
	}

export type MutableAtomFamilyToken<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
> = {
	key: string
	type: `mutable_atom_family`
	__T?: T
	__J?: J
	__K?: K
}
// biome-ignore format: intersection
export type MutableAtomFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
> = 
	& JsonInterface<T, J>
	& MutableAtomFamilyToken<T, J, K>
	& {
			(key: K): MutableAtomToken<T, J>
			subject: Subject<StateCreation<MutableAtomToken<T, J>> | StateDisposal<MutableAtomToken<T, J>>>
			install: (store: Store) => void
		}

export type AtomFamily<T, K extends Canonical = Canonical> =
	| MutableAtomFamily<T extends Transceiver<any> ? T : never, any, K>
	| RegularAtomFamily<T, K>
export type AtomFamilyToken<T, K extends Canonical = Canonical> =
	| MutableAtomFamilyToken<T extends Transceiver<any> ? T : never, any, K>
	| RegularAtomFamilyToken<T, K>

export function atomFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
>(options: MutableAtomFamilyOptions<T, J, K>): MutableAtomFamilyToken<T, J, K>
export function atomFamily<T, K extends Canonical>(
	options: RegularAtomFamilyOptions<T, K>,
): RegularAtomFamilyToken<T, K>
export function atomFamily<T, K extends Canonical>(
	options:
		| MutableAtomFamilyOptions<any, any, any>
		| RegularAtomFamilyOptions<T, K>,
): MutableAtomFamilyToken<any, any, any> | RegularAtomFamilyToken<T, K> {
	return createAtomFamily(options, IMPLICIT.STORE)
}
