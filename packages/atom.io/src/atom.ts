import type { Subject, Transceiver } from "atom.io/internal"
import { createAtom, createAtomFamily } from "atom.io/internal"
import type { Json, JsonInterface } from "atom.io/json"

import type { AtomToken, MutableAtomToken } from "."

export type Effectors<T> = {
	setSelf: <V extends T>(next: V | ((oldValue: T) => V)) => void
	onSet: (callback: (options: { newValue: T; oldValue: T }) => void) => void
}

export type AtomEffect<T> = (tools: Effectors<T>) => void

export type AtomOptions<T> = {
	key: string
	default: T | (() => T)
	effects?: AtomEffect<T>[]
}
// biome-ignore format: complex intersection
export type MutableAtomOptions<T, J extends Json.Serializable> = 
	& JsonInterface<T, J>
	& Omit<AtomOptions<T>, `default`> 
	& { 
			default: ()	=> T
			mutable: true
		}

export function atom<T>(options: AtomOptions<T>): AtomToken<T>
export function atom<T extends Transceiver<any>, J extends Json.Serializable>(
	options: MutableAtomOptions<T, J>,
): MutableAtomToken<T, J>
export function atom<T>(options: AtomOptions<T>): AtomToken<T> {
	return createAtom<T>(options)
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
}
// biome-ignore format: intersection
export type MutableAtomFamilyOptions<
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
	Key extends string,
> = 
	& AtomFamilyOptions<Core, Key>
	& JsonInterface<Core, SerializableCore>

// biome-ignore format: intersection
export type MutableAtomFamily<
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
	Key extends Json.Serializable,
> = 
	& JsonInterface<Core, SerializableCore>
	& ((key: Key) => MutableAtomToken<Core, SerializableCore>) 
	& {
			key: `${string}::mutable`
			type: `atom_family`
			subject: Subject<MutableAtomToken<Core, SerializableCore>>
		}

export function atomFamily<T, K extends Json.Serializable>(
	options: AtomFamilyOptions<T, K>,
): AtomFamily<T, K> {
	return createAtomFamily<T, K>(options)
}
