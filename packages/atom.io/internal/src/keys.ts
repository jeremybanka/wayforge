import type { Store } from "./store"
import { target } from "./transaction"

export type AtomKey<T> = string & { __atomKey?: never; __brand?: T }
export type SelectorKey<T> = string & { __selectorKey?: never; __brand?: T }
export type ReadonlySelectorKey<T> = string & {
	__readonlySelectorKey?: never
	__brand?: T
}

export const isAtomKey = (key: string, store: Store): key is AtomKey<unknown> =>
	target(store).atoms.has(key)
export const isSelectorKey = (
	key: string,
	store: Store,
): key is SelectorKey<unknown> => target(store).selectors.has(key)
export const isReadonlySelectorKey = (
	key: string,
	store: Store,
): key is ReadonlySelectorKey<unknown> =>
	target(store).readonlySelectors.has(key)

export type StateKey<T> = AtomKey<T> | ReadonlySelectorKey<T> | SelectorKey<T>
export const isStateKey = (
	key: string,
	store: Store,
): key is StateKey<unknown> =>
	isAtomKey(key, store) ||
	isSelectorKey(key, store) ||
	isReadonlySelectorKey(key, store)
