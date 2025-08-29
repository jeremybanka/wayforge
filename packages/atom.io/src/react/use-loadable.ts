/** biome-ignore-all lint/correctness/useHookAtTopLevel: params are used in an invariant way */
import type { Loadable, ReadableFamilyToken, ReadableToken } from "atom.io"
import type { Canonical } from "atom.io/json"
import { useO } from "atom.io/react"
import React from "react"

export function useLoadable<T, E>(
	token: ReadableToken<Loadable<T>, any, E>,
): `LOADING` | { loading: boolean; value: E | T }

export function useLoadable<T, K extends Canonical, E>(
	token: ReadableFamilyToken<Loadable<T>, K, E>,
	key: K,
): `LOADING` | { loading: boolean; value: E | T }

export function useLoadable<T, F extends T, E>(
	token: ReadableToken<Loadable<T>, any, E>,
	fallback: F,
): { loading: boolean; value: T }

export function useLoadable<T, K extends Canonical, F extends T, E>(
	token: ReadableFamilyToken<Loadable<T>, K, E>,
	key: K,
	fallback: F,
): { loading: boolean; value: E | T }

export function useLoadable(
	...params:
		| readonly [ReadableFamilyToken<any, Canonical, any>, Canonical, unknown]
		| readonly [ReadableFamilyToken<any, Canonical, any>, Canonical]
		| readonly [ReadableToken<any, any, any>, unknown]
		| readonly [ReadableToken<any, any, any>]
): `LOADING` | { loading: boolean; value: unknown } {
	let state: unknown
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
			state = useO(token)
			fallback = params[1]
			break
		case `atom_family`:
		case `mutable_atom_family`:
		case `readonly_held_selector_family`:
		case `readonly_pure_selector_family`:
		case `writable_held_selector_family`:
		case `writable_pure_selector_family`:
			key = params[1] as Canonical
			state = useO(token, key)
			fallback = params[2]
	}

	const wrapperRef = React.useRef({ loading: false, value: null as unknown })
	const lastLoadedRef = React.useRef(
		fallback ?? (state instanceof Promise ? `LOADING` : state),
	)

	const { current: lastLoaded } = lastLoadedRef
	let { current: wrapper } = wrapperRef

	if (state instanceof Promise) {
		if (lastLoaded === `LOADING`) {
			return `LOADING`
		}
		wrapper = wrapperRef.current = { loading: true, value: lastLoaded }
	} else {
		lastLoadedRef.current = state
		if (wrapper.loading === true) {
			wrapper = wrapperRef.current = { loading: false, value: state }
		} else {
			wrapper.loading = false
			wrapper.value = state
		}
	}

	return wrapper
}
