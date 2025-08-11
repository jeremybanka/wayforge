import { disposeFromStore, IMPLICIT } from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type { ReadableFamilyToken, ReadableToken } from "."

/**
 * Disposes of a state in the implicit store.
 *
 * Only family members can be disposed of.
 *
 * @param token - The token of the state to dispose
 * @overload Default
 */
export function disposeState(token: ReadableToken<any>): void
/**
 * Disposes of a state in the implicit store.
 *
 * Only family members can be disposed of.
 *
 * @param token - The token of the state family to dispose
 * @param key - The unique key of the state to dispose
 * @overload Streamlined
 */
export function disposeState<K extends Canonical>(
	token: ReadableFamilyToken<any, K>,
	key: K,
): void
export function disposeState(
	...params:
		| [token: ReadableFamilyToken<any, any>, key: Canonical]
		| [token: ReadableToken<any>]
): void {
	if (params.length === 2) {
		disposeFromStore(IMPLICIT.STORE, ...params)
	} else {
		disposeFromStore(IMPLICIT.STORE, ...params)
	}
}
