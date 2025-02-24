import * as Internal from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type { ReadableFamilyToken, ReadableToken } from "."

/**
 * @public
 * Get the current value of a state
 * @param token - The token of the state to get
 * @return The current value of the state
 * @overload Default
 * @default
 */
export function getState<T>(token: ReadableToken<T>): T

/**
 * @public
 * Get the current value of a state family
 * @param token - The token of a state family
 * @param key - The unique key of the state to get
 * @return The current value of the state
 * @overload Streamlined
 */
export function getState<T, K extends Canonical, Key extends K>(
	token: ReadableFamilyToken<T, K>,
	key: Key,
): T

export function getState(
	...params:
		| [token: ReadableFamilyToken<any, any>, key: Canonical]
		| [token: ReadableToken<any>]
): any {
	if (params.length === 2) {
		return Internal.getFromStore(Internal.IMPLICIT.STORE, ...params)
	}
	return Internal.getFromStore(Internal.IMPLICIT.STORE, ...params)
}
