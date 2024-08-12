import type { Flat } from "atom.io/internal"

export type Entries<K extends keyof any = keyof any, V = any> = [K, V][]

export type KeyOfEntries<E extends Entries> = E extends [infer K, any][]
	? K
	: never

type Range<N extends number, A extends any[] = []> = A[`length`] extends N
	? A[`length`]
	: A[`length`] | Range<N, [...A, any]>

export type CertainEntry<E extends Entries, K extends KeyOfEntries<E>> = {
	[P in Range<E[`length`]>]: E[P] extends [K, infer V] ? V : never
}[Range<E[`length`]>]

export type FromEntries<E extends Entries> = Flat<{
	[K in KeyOfEntries<E>]: CertainEntry<E, K>
}>

export function fromEntries<E extends Entries>(entries: E): FromEntries<E> {
	return Object.fromEntries(entries) as FromEntries<E>
}
