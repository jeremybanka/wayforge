import type { Store, Subject, Transceiver } from "atom.io/internal"
import {
	IMPLICIT,
	createAtomFamily,
	createStandaloneAtom,
} from "atom.io/internal"
import type { Json, JsonInterface } from "atom.io/json"

import type { AtomToken, MutableAtomToken, RegularAtomToken } from "."

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

export function atom<T extends Transceiver<any>, J extends Json.Serializable>(
	options: MutableAtomOptions<T, J>,
): MutableAtomToken<T, J>
export function atom<T>(options: RegularAtomOptions<T>): RegularAtomToken<T>
export function atom(
	options: MutableAtomOptions<any, any> | RegularAtomOptions<any>,
): AtomToken<any> {
	return createStandaloneAtom(options, IMPLICIT.STORE)
}

export type RegularAtomFamilyOptions<T, K extends Json.Serializable> = {
	key: string
	default: T | ((key: K) => T)
	effects?: (key: K) => AtomEffect<T>[]
}

export type RegularAtomFamilyToken<T, K extends Json.Serializable> = {
	key: string
	type: `atom_family`
	__T?: T
	__K?: K
}
// biome-ignore format: intersection
export type RegularAtomFamilyTokenWithCall<
	T,
	K extends Json.Serializable,
> = 
	& RegularAtomFamilyToken<T, K>
	& /** @deprecated Prefer the `findState`, `findInStore`, or `find` functions. */
((key: K) => RegularAtomToken<T>)
// biome-ignore format: intersection
export type RegularAtomFamily<T, K extends Json.Serializable> = 
	& RegularAtomFamilyToken<T, K>
	& {
		(key: K): RegularAtomToken<T>
		subject: Subject<RegularAtomToken<T>>
		install: (store: Store) => void
	}

// biome-ignore format: intersection
export type MutableAtomFamilyOptions<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
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
	K extends Json.Serializable,
> = {
	key: string
	type: `mutable_atom_family`
	__T?: T
	__J?: J
	__K?: K
}
// biome-ignore format: intersection
export type MutableAtomFamilyTokenWithCall<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
> = 
	& MutableAtomFamilyToken<T, J, K>
	& /** @deprecated Prefer the `findState`, `findInStore`, or `find` functions. */
((key: K) => MutableAtomToken<T, J>)
// biome-ignore format: intersection
export type MutableAtomFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
> = 
	& JsonInterface<T, J>
	& MutableAtomFamilyToken<T, J, K>
	& {
			(key: K): MutableAtomToken<T, J>
			subject: Subject<MutableAtomToken<T, J>>
			install: (store: Store) => void
		}

export type AtomFamily<T, K extends Json.Serializable = Json.Serializable> =
	| MutableAtomFamily<T extends Transceiver<any> ? T : never, any, K>
	| RegularAtomFamily<T, K>
export type AtomFamilyToken<T, K extends Json.Serializable = Json.Serializable> =
	| MutableAtomFamilyToken<T extends Transceiver<any> ? T : never, any, K>
	| RegularAtomFamilyToken<T, K>

export function atomFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
>(
	options: MutableAtomFamilyOptions<T, J, K>,
): MutableAtomFamilyTokenWithCall<T, J, K>
export function atomFamily<T, K extends Json.Serializable>(
	options: RegularAtomFamilyOptions<T, K>,
): RegularAtomFamilyTokenWithCall<T, K>
export function atomFamily<T, K extends Json.Serializable>(
	options:
		| MutableAtomFamilyOptions<any, any, any>
		| RegularAtomFamilyOptions<T, K>,
):
	| MutableAtomFamilyTokenWithCall<any, any, any>
	| RegularAtomFamilyTokenWithCall<T, K> {
	return createAtomFamily(options, IMPLICIT.STORE)
}
