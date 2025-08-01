import * as Internal from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type { ReadableFamilyToken, ReadableToken } from "."

/**
 * @public
 * Disposes of a state in the implicit store.
 *
 * Only family members can be disposed of.
 *
 * @param token - The token of the state to dispose
 * @overload Default
 */
export function disposeState(token: ReadableToken<any>): void
/**
 * @public
 * Disposes of a state in the implicit store.
 *
 * Only family members can be disposed of.
 *
 * @param token - The token of the state family to dispose
 * @param key - The unique key of the state to dispose
 */
export function disposeState<K extends Canonical>(
	token: ReadableFamilyToken<any, K>,
	key: K,
): void
export function disposeState(
	...[token, key]:
		| [token: ReadableFamilyToken<any, any>, key: Canonical]
		| [token: ReadableToken<any>]
): void {
	if (key) {
		Internal.disposeFromStore(Internal.IMPLICIT.STORE, token as any, key)
	} else {
		Internal.disposeFromStore(Internal.IMPLICIT.STORE, token as any)
	}
}
