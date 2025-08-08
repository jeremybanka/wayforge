import type { Count, Flat } from "atom.io/internal"

/** Tuples of `[key, value]` pairs, as returned from `Object.entries` */
export type Entries<K extends PropertyKey = PropertyKey, V = any> = [K, V][]

/** The collective or "union" type of the keys in a set of entries */
export type KeyOfEntries<E extends Entries> = E extends [infer K, any][]
	? K
	: never

/** The type of the value of entry `K` in a set of entries `E` */
export type ValueOfEntry<E extends Entries, K extends KeyOfEntries<E>> = {
	[P in Count<E[`length`]>]: E[P] extends [K, infer V] ? V : never
}[Count<E[`length`]>]

/** The type of a set of entries `E` in object form */
export type FromEntries<E extends Entries> = Flat<{
	[K in KeyOfEntries<E>]: ValueOfEntry<E, K>
}>

/** Typed form of `Object.fromEntries` */
export function fromEntries<E extends Entries>(entries: E): FromEntries<E> {
	return Object.fromEntries(entries) as FromEntries<E>
}

/** The type of an object T in {@link Entries} form */
export type ToEntries<T extends object> = Entries<keyof T, T[keyof T]>

/** Typed form of `Object.entries` */
export function toEntries<T extends object>(obj: T): ToEntries<T> {
	return Object.entries(obj) as Entries<keyof T, T[keyof T]>
}
