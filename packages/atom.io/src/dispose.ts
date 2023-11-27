import * as Internal from "atom.io/internal"

import type { ReadonlySelectorToken, StateToken } from "."

export function dispose(
	token: ReadonlySelectorToken<any> | StateToken<any>,
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
