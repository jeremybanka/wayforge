import type { Flat } from "atom.io/internal"

export type Entries<K extends keyof any = keyof any, V = any> = [K, V][]

export type KeyOfEntries<E extends Entries> = E extends [infer K, any][]
	? K
	: never

export type UpToTen = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type CertainEntry<E extends Entries, K extends KeyOfEntries<E>> = {
	[P in UpToTen]: E[P] extends [K, infer V] ? V : never
}[UpToTen]

export type FromEntries<E extends Entries> = Flat<{
	[K in KeyOfEntries<E>]: CertainEntry<E, K>
}>

export function fromEntries<E extends Entries>(entries: E): FromEntries<E> {
	return Object.fromEntries(entries) as FromEntries<E>
}
