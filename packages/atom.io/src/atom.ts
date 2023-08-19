import type { Subject } from "atom.io/internal"
import { atomFamily__INTERNAL, atom__INTERNAL } from "atom.io/internal"
import type { Json } from "atom.io/json"

import type { AtomToken } from "."

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

export function atom<T>(options: AtomOptions<T>): AtomToken<T> {
	return atom__INTERNAL<T>(options)
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

export function atomFamily<T, K extends Json.Serializable>(
	options: AtomFamilyOptions<T, K>,
): AtomFamily<T, K> {
	return atomFamily__INTERNAL<T, K>(options)
}
