import type { Flat } from "atom.io/internal"

export type Entries<K extends keyof any, V> = [key: K, value: V][]

export type KeyOfEntries<E extends Entries<any, any>> = E extends [
	key: infer K,
	value: any,
][]
	? K
	: never

export type UpToTen = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type CertainEntry<
	E extends Entries<any, any>,
	K extends KeyOfEntries<E>,
> = {
	[P in UpToTen]: E[P] extends [key: K, value: infer V] ? V : never
}[UpToTen]

export type FromEntries<E extends Entries<keyof any, any>> = Flat<{
	[K in KeyOfEntries<E>]: CertainEntry<E, K>
}>

export function fromEntries<E extends Entries<keyof any, any>>(
	entries: E,
): FromEntries<E> {
	return Object.fromEntries(entries) as FromEntries<E>
}
