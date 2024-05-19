import * as Internal from "atom.io/internal"

import type { ReadableToken } from "."

export function disposeState(token: ReadableToken<any>): void {
	Internal.disposeFromStore(token, Internal.IMPLICIT.STORE)
}
