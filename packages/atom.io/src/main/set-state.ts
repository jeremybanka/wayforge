import { IMPLICIT, setIntoStore } from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type { WritableFamilyToken, WritableToken } from "./tokens"

/**
 * A function that sets the value of a state.
 * @param oldValue - The current value of the state.
 * @returns
 * The new value of the state.
 */
export type Setter<T, New extends T> = (oldValue: T) => New

/**
 * Set the value of a state into the implicit store.
 * @param token - An atom or writable selector token.
 * @param value - The new value of the state.
 * @overload Default
 * @default
 */
export function setState<T, New extends T>(
	token: WritableToken<T>,
	value: New | Setter<T, New>,
): void

/**
 * Set the value of a state into the implicit store.
 * @param token - An atom family or writable selector family token.
 * @param key - The unique key of the state to set.
 * @param value - The new value of the state.
 * @overload Streamlined
 */
export function setState<T, K extends Canonical, New extends T, Key extends K>(
	token: WritableFamilyToken<T, K>,
	key: Key,
	value: New | Setter<T, New>,
): void
export function setState<T, New extends T>(
	...params:
		| [
				token: WritableFamilyToken<T, Canonical>,
				key: Canonical,
				value: New | Setter<T, New>,
		  ]
		| [token: WritableToken<T>, value: New | Setter<T, New>]
): void {
	if (params.length === 2) {
		setIntoStore(IMPLICIT.STORE, ...params)
	} else {
		setIntoStore(IMPLICIT.STORE, ...params)
	}
}
