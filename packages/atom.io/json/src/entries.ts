import type { Flat, Range } from "atom.io/internal"

export type Entries<K extends PropertyKey = keyof any, V = any> = [K, V][]

export type KeyOfEntries<E extends Entries> = E extends [infer K, any][]
	? K
	: never

export type ValueOfEntry<E extends Entries, K extends KeyOfEntries<E>> = {
	[P in Range<E[`length`]>]: E[P] extends [K, infer V] ? V : never
}[Range<E[`length`]>]

export type FromEntries<E extends Entries> = Flat<{
	[K in KeyOfEntries<E>]: ValueOfEntry<E, K>
}>

export function fromEntries<E extends Entries>(entries: E): FromEntries<E> {
	return Object.fromEntries(entries) as FromEntries<E>
}

export function toEntries<T extends object>(
	obj: T,
): Entries<keyof T, T[keyof T]> {
	return Object.entries(obj) as Entries<keyof T, T[keyof T]>
}
