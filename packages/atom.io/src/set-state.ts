import * as Internal from "atom.io/internal"

import type { WritableToken } from "."

export function setState<T, New extends T>(
	token: WritableToken<T>,
	value: New | ((oldValue: T) => New),
): void {
	Internal.setIntoStore(token, value, Internal.IMPLICIT.STORE)
}
