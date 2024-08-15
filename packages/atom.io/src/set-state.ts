import * as Internal from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type { WritableFamilyToken, WritableToken } from "."

/**
 * @public
 * Set the value of a state into the implicit store.
 * @param token - The unique identifier of the state to set.
 * @param value - The new value of the state.
 * @overload Default
 * @default
 */
export function setState<T, New extends T>(
	token: WritableToken<T>,
	value: New | ((oldValue: T) => New),
): void

/**
 * @public
 * Set the value of a state into the implicit store.
 * @param token - The unique identifier of a state family.
 * @param key - The key of the state to set.
 * @param value - The new value of the state.
 * @overload Streamlined
 */
export function setState<T, K extends Canonical, New extends T, Key extends K>(
	token: WritableFamilyToken<T, K>,
	key: Key,
	value: New | ((oldValue: T) => New),
): void

export function setState<T, New extends T>(
	...params:
		| [
				token: WritableFamilyToken<T, Canonical>,
				key: Canonical,
				value: New | ((oldValue: T) => New),
		  ]
		| [token: WritableToken<T>, value: New | ((oldValue: T) => New)]
): void {
	if (params.length === 2) {
		Internal.setIntoStore(Internal.IMPLICIT.STORE, ...params)
	} else {
		Internal.setIntoStore(Internal.IMPLICIT.STORE, ...params)
	}
}
