import type { WritableToken } from "atom.io"

import { closeOperation, openOperation } from "../operation"
import type { Store } from "../store"
import { withdrawOrCreate } from "../store"
import { setAtomOrSelector } from "./set-atom-or-selector"

export function setIntoStore<T, New extends T>(
	token: WritableToken<T>,
	value: New | ((oldValue: T) => New),
	store: Store,
): void {
	const rejection = openOperation(token, store)
	if (rejection) {
		const unsubscribe = store.on.operationClose.subscribe(
			`waiting to set "${token.key}"`,
			() => {
				unsubscribe()
				setIntoStore(token, value, store)
			},
		)
		return
	}
	const state = withdrawOrCreate(token, store)
	setAtomOrSelector(state, value, store)
	closeOperation(store)
}
