import * as Internal from "atom.io/internal"

import type { StateToken } from "."

export function setState<T, New extends T>(
	token: StateToken<T>,
	value: New | ((oldValue: T) => New),
	store: Internal.Store = Internal.IMPLICIT.STORE,
): void {
	const rejection = Internal.openOperation(token, store)
	if (rejection) {
		return
	}
	const state = Internal.withdraw(token, store)
	if (state === undefined) {
		throw new Internal.NotFoundError(token, store)
	}
	Internal.setAtomOrSelector(state, value, store)
	Internal.closeOperation(store)
}
