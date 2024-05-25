import type { MoleculeToken } from "atom.io/immortal"
import * as Internal from "atom.io/internal"

import type { ReadableToken } from "."

export function disposeState(
	token: MoleculeToken<any> | ReadableToken<any>,
): void {
	Internal.disposeFromStore(token, Internal.IMPLICIT.STORE)
}
