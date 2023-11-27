import * as Internal from "atom.io/internal"

import type { StateToken } from "."
import { NotFoundError } from "../internal/src/not-found-error"

export function setState<T, New extends T>(
	token: StateToken<T>,
	value: New | ((oldValue: T) => New),
	store: Internal.Store = Internal.IMPLICIT.STORE,
): void {
	const rejection = Internal.openOperation(token, store)
	if (rejection) {
		return
	}
	const state =
		Internal.withdraw(token, store) ??
		Internal.withdrawNewFamilyMember(token, store)
	if (state === undefined) {
		throw new NotFoundError(token, store)
	}
	Internal.setAtomOrSelector(state, value, store)
	Internal.closeOperation(store)
}
