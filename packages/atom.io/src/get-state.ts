import * as Internal from "atom.io/internal"

import type { ReadableToken } from "."

export function getState<T>(token: ReadableToken<T>): T {
	return Internal.getFromStore(token, Internal.IMPLICIT.STORE)
}
