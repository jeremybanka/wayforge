import { setAtomState } from "./set-atom-state"
import { setSelectorState } from "./set-selector-state"
import type { Atom, Selector, Store } from ".."
import { IMPLICIT } from ".."

export const setState__INTERNAL = <T>(
	state: Atom<T> | Selector<T>,
	value: T | ((oldValue: T) => T),
	store: Store = IMPLICIT.STORE,
): void => {
	if (`set` in state) {
		setSelectorState(state, value, store)
	} else {
		setAtomState(state, value, store)
	}
}
