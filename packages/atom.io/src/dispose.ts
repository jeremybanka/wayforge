import * as Internal from "atom.io/internal"

import type { ReadableToken } from "."

export function dispose(
	token: ReadableToken<any>,
	store: Internal.Store = Internal.IMPLICIT.STORE,
): void {
	switch (token.type) {
		case `atom`:
			Internal.deleteAtom(token, store)
			break
		case `selector`:
		case `readonly_selector`:
			Internal.deleteSelector(token, store)
			break
	}
}
