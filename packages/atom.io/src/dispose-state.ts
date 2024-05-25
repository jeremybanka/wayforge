import * as Internal from "atom.io/internal"

import type { ReadableToken } from "."
import type { MoleculeToken } from "./molecule"

export function disposeState(
	token: MoleculeToken<any> | ReadableToken<any>,
): void {
	Internal.disposeFromStore(token, Internal.IMPLICIT.STORE)
}
