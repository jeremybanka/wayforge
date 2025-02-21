import * as Internal from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type { ReadableFamilyToken, ReadableToken } from "."

export function disposeState(token: ReadableToken<any>): void

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
