import * as Internal from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import type { Json } from "rel8"

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
	token: WritableFamilyToken<T, Canonical> | WritableToken<T>,
	p1: Json.Serializable | New | ((oldValue: T) => New),
	p2?: New | ((oldValue: T) => New),
): void {
	if (p2) {
		Internal.setIntoStore(token as any, p1 as any, p2, Internal.IMPLICIT.STORE)
	} else {
		Internal.setIntoStore(token as any, p1 as any, Internal.IMPLICIT.STORE)
	}
}
