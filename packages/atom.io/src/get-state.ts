import * as Internal from "atom.io/internal"

import type { ReadableToken } from "."

export function getState<T>(
	token: ReadableToken<T>,
	store: Internal.Store = Internal.IMPLICIT.STORE,
): T {
	const state =
		Internal.withdraw(token, store) ??
		Internal.withdrawNewFamilyMember(token, store)
	if (state === undefined) {
		throw new Internal.NotFoundError(token, store)
	}
	return Internal.readOrComputeValue(state, store)
}
