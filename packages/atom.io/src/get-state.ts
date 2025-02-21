import * as Internal from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type { ReadableFamilyToken, ReadableToken } from "."

export function getState<T>(token: ReadableToken<T>): T

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
