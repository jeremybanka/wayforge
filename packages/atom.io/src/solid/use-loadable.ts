/** biome-ignore-all lint/correctness/useHookAtTopLevel: params are used in an invariant way */
import type {
	Loadable,
	ReadableFamilyToken,
	ReadableToken,
	ViewOf,
} from "atom.io"
import { findInStore, type ReadableState, withdraw } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { useContext } from "solid-js"

import { StoreContext } from "./store-context"
import { useO } from "./use-o"

export function useLoadable<T, E>(
	token: ReadableToken<Loadable<T>, any, E>,
): () => `LOADING` | { loading: boolean; value: ViewOf<E | T> }

export function useLoadable<T, K extends Canonical, E>(
	token: ReadableFamilyToken<Loadable<T>, K, E>,
	key: NoInfer<K>,
): () => `LOADING` | { loading: boolean; value: ViewOf<E | T> }

export function useLoadable<T, F extends T, E>(
	token: ReadableToken<Loadable<T>, any, E>,
	fallback: F,
): () => { loading: boolean; value: ViewOf<T>; error?: E }

export function useLoadable<T, K extends Canonical, F extends T, E>(
	token: ReadableFamilyToken<Loadable<T>, K, E>,
	key: NoInfer<K>,
	fallback: F,
): () => { loading: boolean; value: ViewOf<T>; error?: E }

export function useLoadable(
	...params:
		| readonly [ReadableFamilyToken<any, Canonical, any>, Canonical, unknown]
		| readonly [ReadableFamilyToken<any, Canonical, any>, Canonical]
		| readonly [ReadableToken<any, any, any>, unknown]
		| readonly [ReadableToken<any, any, any>]
): () => `LOADING` | { loading: boolean; value: unknown; error?: unknown } {
	const store = useContext(StoreContext)

	let readValue: () => unknown
	let state: ReadableState<any, any>
	let fallback: unknown

	const [token] = params
	let key: Canonical
	switch (token.type) {
		case `atom`:
		case `mutable_atom`:
		case `readonly_held_selector`:
		case `readonly_pure_selector`:
		case `writable_held_selector`:
		case `writable_pure_selector`:
			readValue = useO(token)
			state = withdraw(store, token)
			fallback = params[1]
			break
		case `atom_family`:
		case `mutable_atom_family`:
		case `readonly_held_selector_family`:
		case `readonly_pure_selector_family`:
		case `writable_held_selector_family`:
		case `writable_pure_selector_family`:
			key = params[1] as Canonical
			readValue = useO(token, key)
			state = withdraw(store, findInStore(store, token, key))
			fallback = params[2]
	}

	const hasFallback = fallback !== undefined
	let wrapper: {
		loading: boolean
		value: unknown
		error?: unknown
	} = { loading: false, value: null as unknown }
	let lastLoaded = fallback

	return () => {
		const value = readValue()
		const isErr = `catch` in state && state.catch.some((E) => value instanceof E)
		lastLoaded ??= value instanceof Promise ? `LOADING` : value

		const wasErr =
			`catch` in state && state.catch.some((E) => lastLoaded instanceof E)

		if (value instanceof Promise) {
			if (lastLoaded === `LOADING`) {
				return `LOADING`
			}
			if (wasErr && hasFallback) {
				wrapper = {
					loading: true,
					value: fallback,
					error: lastLoaded,
				}
			} else {
				wrapper = { loading: true, value: lastLoaded }
			}
			return wrapper
		}

		lastLoaded = value
		if (wrapper.loading === true) {
			if (isErr && hasFallback) {
				wrapper = {
					loading: false,
					value: fallback,
					error: value,
				}
			} else {
				wrapper = { loading: false, value }
			}
		} else if (isErr && hasFallback) {
			wrapper.loading = false
			wrapper.value = fallback
			wrapper.error = value
		} else {
			wrapper.loading = false
			wrapper.value = value
			delete wrapper.error
		}
		return wrapper
	}
}
