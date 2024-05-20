import type { ReadableToken } from "atom.io"
import * as Internal from "atom.io/internal"

export function disposeFromStore(
	token: ReadableToken<any>,
	store: Internal.Store = Internal.IMPLICIT.STORE,
): void {
	switch (token.type) {
		case `atom`:
		case `mutable_atom`:
			Internal.disposeAtom(token, store)
			break
		case `selector`:
		case `readonly_selector`:
			Internal.disposeSelector(token, store)
			break
	}
}