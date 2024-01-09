import type { Store, Subject, Transceiver } from "atom.io/internal"
import {
	IMPLICIT,
	createAtomFamily,
	createStandaloneAtom,
} from "atom.io/internal"
import type { Json, JsonInterface } from "atom.io/json"

import type { AtomToken, MutableAtomToken } from "."

export type Effectors<T> = {
	setSelf: <V extends T>(next: V | ((oldValue: T) => V)) => void
	onSet: (callback: (options: { newValue: T; oldValue: T }) => void) => void
}

export type AtomEffect<T> = (tools: Effectors<T>) => (() => void) | void

export type AtomOptions<T> = {
	key: string
	default: T | (() => T)
	effects?: AtomEffect<T>[]
}
// biome-ignore format: complex intersection
export type MutableAtomOptions<T extends Transceiver<any>, J extends Json.Serializable> = 
	& JsonInterface<T, J>
	& Omit<AtomOptions<T>, `default`> 
	& { 
			default: ()	=> T
			mutable: true
		}

export function atom<T extends Transceiver<any>, J extends Json.Serializable>(
	options: MutableAtomOptions<T, J>,
): MutableAtomToken<T, J>
export function atom<T>(options: AtomOptions<T>): AtomToken<T>
export function atom(
	options: AtomOptions<any> | MutableAtomOptions<any, any>,
): AtomToken<any> {
	return createStandaloneAtom(options, IMPLICIT.STORE)
}

export type AtomFamilyOptions<T, K extends Json.Serializable> = {
	key: string
	default: T | ((key: K) => T)
	effects?: (key: K) => AtomEffect<T>[]
}

export type AtomFamily<T, K extends Json.Serializable = Json.Serializable> = ((
	key: K,
) => AtomToken<T>) & {
	key: string
	type: `atom_family`
	subject: Subject<AtomToken<T>>
	mutable?: boolean
	install: (store: Store) => void
	__T?: T
	__K?: K
}
export type AtomFamilyToken<T, K extends Json.Serializable> = {
	key: string
	type: `atom_family`
	__T?: T
	__K?: K
}

// biome-ignore format: intersection
export type MutableAtomFamilyOptions<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
> = 
	& AtomFamilyOptions<T, K>
	& JsonInterface<T, J>
	& { mutable: true }

// biome-ignore format: intersection
export type MutableAtomFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
> = 
	& JsonInterface<T, J>
	& ((key: K) => MutableAtomToken<T, J>) 
	& {
			key: string
			type: `atom_family`
			subject: Subject<MutableAtomToken<T, J>>
			mutable: true
			install: (store: Store) => void
			__T?: T
			__J?: J
			__K?: K
		}
export type MutableAtomFamilyToken<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
> = {
	key: string
	type: `atom_family`
	mutable: true
	__T?: T
	__J?: J
	__K?: K
}

export function atomFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
>(options: MutableAtomFamilyOptions<T, J, K>): MutableAtomFamily<T, J, K>
export function atomFamily<T, K extends Json.Serializable>(
	options: AtomFamilyOptions<T, K>,
): AtomFamily<T, K>
export function atomFamily<T, K extends Json.Serializable>(
	options: AtomFamilyOptions<T, K> | MutableAtomFamilyOptions<any, any, any>,
): AtomFamily<T, K> | MutableAtomFamily<any, any, any> {
	return createAtomFamily(options, IMPLICIT.STORE)
}
