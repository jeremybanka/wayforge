import type { ViewOf } from "atom.io"
import { getFromStore, IMPLICIT } from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type { ReadableFamilyToken, ReadableToken } from "."

/**
 * Read or compute the current value of a state
 * @param token - The token of the state to get
 * @return The current value of the state
 * @overload Default
 * @default
 */
export function getState<T, E = never>(
	token: ReadableToken<T, any, E>,
): ViewOf<E | T>

/**
 * Read or compute the current value of a state
 * @param token - The token of a state family
 * @param key - The unique key of the state to get
 * @return The current value of the state
 * @overload Streamlined
 */
export function getState<T, K extends Canonical, Key extends K, E = never>(
	token: ReadableFamilyToken<T, K, E>,
	key: Key,
): ViewOf<E | T>

export function getState<T, K extends Canonical, Key extends K, E = never>(
	...params:
		| [token: ReadableFamilyToken<T, K, E>, key: Key]
		| [token: ReadableToken<T, any, E>]
): ViewOf<E | T> {
	return getFromStore(IMPLICIT.STORE, ...params)
}
