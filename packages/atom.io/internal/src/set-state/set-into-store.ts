import type { WritableToken } from "atom.io"

import { NotFoundError } from "../not-found-error"
import { closeOperation, openOperation } from "../operation"
import type { Store } from "../store"
import { withdraw, withdrawNewFamilyMember } from "../store"
import { setAtomOrSelector } from "./set-atom-or-selector"

export function setIntoStore<T, New extends T>(
	token: WritableToken<T>,
	value: New | ((oldValue: T) => New),
	store: Store,
): void {
	const rejection = openOperation(token, store)
	if (rejection) {
		return
	}
	const state = withdraw(token, store) ?? withdrawNewFamilyMember(token, store) // WITHDRAW_ANALYSIS 😡 THROWN ERROR
	if (state === undefined) {
		throw new NotFoundError(token, store)
	}
	setAtomOrSelector(state, value, store)
	closeOperation(store)
}
