import { IMPLICIT, setIntoStore } from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type { WritableFamilyToken, WritableToken } from "./tokens"

/**
 * A function that sets the value of a state.
 * @param oldValue - The current value of the state.
 * @returns
 * The new value of the state.
 */
export type Setter<T> = (oldValue: T) => T

/**
 * Set the value of a state into the implicit store.
 * @param token - An atom or writable selector token.
 * @param value - The new value of the state.
 * @overload Default
 * @default
 */
export function setState<T>(
	token: WritableToken<T, any, any>,
	value: NoInfer<T> | Setter<NoInfer<T>>,
): void

/**
 * Set the value of a state into the implicit store.
 * @param token - An atom family or writable selector family token.
 * @param key - The unique key of the state to set.
 * @param value - The new value of the state.
 * @overload Streamlined
 */
export function setState<T, K extends Canonical>(
	token: WritableFamilyToken<T, K, any>,
	key: NoInfer<K>,
	value: NoInfer<T> | Setter<NoInfer<T>>,
): void

export function setState<T, K extends Canonical>(
	...params:
		| [
				token: WritableFamilyToken<T, K, any>,
				key: NoInfer<K>,
				value: NoInfer<T> | Setter<NoInfer<T>>,
		  ]
		| [token: WritableToken<T, any, any>, value: NoInfer<T> | Setter<NoInfer<T>>]
): void {
	setIntoStore(IMPLICIT.STORE, ...params)
}
