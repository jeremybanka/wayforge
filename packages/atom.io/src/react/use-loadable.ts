/** biome-ignore-all lint/correctness/useHookAtTopLevel: params are used in an invariant way */
import type { Loadable, ReadableFamilyToken, ReadableToken } from "atom.io"
import { findInStore, type ReadableState, withdraw } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { StoreContext, useO } from "atom.io/react"
import React from "react"

export function useLoadable<T>(
	token: ReadableToken<Loadable<T>, any, never>,
): `LOADING` | { loading: boolean; value: T }

export function useLoadable<T, K extends Canonical, Key extends K>(
	token: ReadableFamilyToken<Loadable<T>, K, never>,
	key: Key,
): `LOADING` | { loading: boolean; value: T }

export function useLoadable<T, F extends T>(
	token: ReadableToken<Loadable<T>, any, never>,
	fallback: F,
): { loading: boolean; value: T }

export function useLoadable<T, K extends Canonical, F extends T, Key extends K>(
	token: ReadableFamilyToken<Loadable<T>, K, never>,
	key: Key,
	fallback: F,
): { loading: boolean; value: T }

export function useLoadable<T, E>(
	token: ReadableToken<Loadable<T>, any, E>,
): `LOADING` | { loading: boolean; value: E | T }

export function useLoadable<T, K extends Canonical, Key extends K, E>(
	token: ReadableFamilyToken<Loadable<T>, K, E>,
	key: Key,
): `LOADING` | { loading: boolean; value: E | T }

export function useLoadable<T, F extends T, E>(
	token: ReadableToken<Loadable<T>, any, E>,
	fallback: F,
): { loading: boolean; value: T; error?: E }

export function useLoadable<
	T,
	K extends Canonical,
	F extends T,
	Key extends K,
	E,
>(
	token: ReadableFamilyToken<Loadable<T>, K, E>,
	key: Key,
	fallback: F,
): { loading: boolean; value: T; error?: E }

export function useLoadable(
	...params:
		| readonly [ReadableFamilyToken<any, Canonical, any>, Canonical, unknown]
		| readonly [ReadableFamilyToken<any, Canonical, any>, Canonical]
		| readonly [ReadableToken<any, any, any>, unknown]
		| readonly [ReadableToken<any, any, any>]
): `LOADING` | { loading: boolean; value: unknown; error?: unknown } {
	const store = React.useContext(StoreContext)

	let value: unknown
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
			value = useO(token)
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
			value = useO(token, key)
			state = withdraw(store, findInStore(store, token, key))
			fallback = params[2]
	}

	const isErr = `catch` in state && state.catch.some((E) => value instanceof E)

	const wrapperRef = React.useRef<{
		loading: boolean
		value: unknown
		error?: unknown
	}>({ loading: false, value: null as unknown })
	const lastLoadedRef = React.useRef(
		fallback ?? (value instanceof Promise ? `LOADING` : value),
	)

	const { current: lastLoaded } = lastLoadedRef
	let { current: wrapper } = wrapperRef

	const wasErr =
		`catch` in state && state.catch.some((E) => lastLoaded instanceof E)

	if (value instanceof Promise) {
		if (lastLoaded === `LOADING`) {
			return `LOADING`
		}
		if (wasErr && fallback) {
			wrapper = wrapperRef.current = {
				loading: true,
				value: fallback,
				error: lastLoaded,
			}
		} else {
			wrapper = wrapperRef.current = { loading: true, value: lastLoaded }
		}
	} else {
		lastLoadedRef.current = value
		if (wrapper.loading === true) {
			if (isErr && fallback) {
				wrapper = wrapperRef.current = {
					loading: false,
					value: fallback,
					error: value,
				}
			} else {
				wrapper = wrapperRef.current = { loading: false, value: value }
			}
		} else {
			if (isErr && fallback) {
				wrapper.loading = false
				wrapper.value = fallback
				wrapper.error = value
			} else {
				wrapper.loading = false
				wrapper.value = value
				if (`error` in wrapper) delete wrapper.error
			}
		}
	}

	return wrapper
}
