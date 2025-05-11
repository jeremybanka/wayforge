import { newest } from "./lineage"
import type { Store } from "./store"

export type AtomKey<T> = string & { __atomKey?: never; __brand?: T }
export type SelectorKey<T> = string & { __selectorKey?: never; __brand?: T }
export type ReadonlySelectorKey<T> = string & {
	__readonlySelectorKey?: never
	__brand?: T
}

export const isAtomKey = (store: Store, key: string): key is AtomKey<unknown> =>
	newest(store).atoms.has(key)
export const isSelectorKey = (
	store: Store,
	key: string,
): key is SelectorKey<unknown> => newest(store).writableSelectors.has(key)
export const isReadonlySelectorKey = (
	store: Store,
	key: string,
): key is ReadonlySelectorKey<unknown> =>
	newest(store).readonlySelectors.has(key)

export type StateKey<T> = AtomKey<T> | ReadonlySelectorKey<T> | SelectorKey<T>
export const isStateKey = (
	store: Store,
	key: string,
): key is StateKey<unknown> =>
	isAtomKey(store, key) ||
	isSelectorKey(store, key) ||
	isReadonlySelectorKey(store, key)
