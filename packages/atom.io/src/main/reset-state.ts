import * as Internal from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type { WritableFamilyToken, WritableToken } from "."

/**
 * Set the value of a state into the implicit store back to its default value.
 * @param token - An atom or writable selector token.
 * @overload Default
 * @default
 */
export function resetState(token: WritableToken<any>): void
/**
 * Set the value of a state into the implicit store back to its default value.
 * @param token - An atom family or writable selector family token.
 * @param key - The unique key of the state to set.
 * @overload Streamlined
 */
export function resetState<K extends Canonical>(
	token: WritableFamilyToken<any, K>,
	key: K,
): void
export function resetState(
	...params:
		| [token: WritableFamilyToken<any, Canonical>, key: Canonical]
		| [token: WritableToken<any>]
): void {
	if (params.length === 2) {
		Internal.resetInStore(Internal.IMPLICIT.STORE, ...params)
	} else {
		Internal.resetInStore(Internal.IMPLICIT.STORE, ...params)
	}
}
