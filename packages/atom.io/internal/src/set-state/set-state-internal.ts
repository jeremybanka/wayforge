import type { Atom } from "../atom"
import type { Selector } from "../selector"
import type { Store } from "../store"
import { IMPLICIT } from "../store"
import { setAtom } from "./set-atom"

export const setState__INTERNAL = <T>(
	state: Atom<T> | Selector<T>,
	value: T | ((oldValue: T) => T),
	store: Store = IMPLICIT.STORE,
): void => {
	if (state.type === `selector`) {
		state.set(value)
	} else {
		setAtom(state, value, store)
	}
}
