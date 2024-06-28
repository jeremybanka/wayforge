import * as Internal from "atom.io/internal"
import type { Json } from "rel8"

import type { WritableFamilyToken, WritableToken } from "."

export function setState<T, New extends T>(
	token: WritableToken<T>,
	value: New | ((oldValue: T) => New),
): void

export function setState<T, K extends Json.Serializable, New extends T>(
	token: WritableFamilyToken<T, K>,
	key: K,
	value: New | ((oldValue: T) => New),
): void

export function setState<T, New extends T>(
	token: WritableFamilyToken<T, Json.Serializable> | WritableToken<T>,
	p1: Json.Serializable | New | ((oldValue: T) => New),
	p2?: New | ((oldValue: T) => New),
): void {
	if (p2) {
		Internal.setIntoStore(token as any, p1 as any, p2, Internal.IMPLICIT.STORE)
	} else {
		Internal.setIntoStore(token as any, p1 as any, Internal.IMPLICIT.STORE)
	}
}
