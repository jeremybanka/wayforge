import type { ReadableToken } from "atom.io"

import { NotFoundError } from "../not-found-error"
import type { Store } from "../store"
import { withdraw, withdrawNewFamilyMember } from "../store"
import { readOrComputeValue } from "./read-or-compute-value"

export function getFromStore<T>(token: ReadableToken<T>, store: Store): T {
	const state = withdraw(token, store) ?? withdrawNewFamilyMember(token, store)
	if (state === undefined) {
		throw new NotFoundError(token, store)
	}
	return readOrComputeValue(state, store)
}
