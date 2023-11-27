import type { Atom } from "../atom"
import type { Selector } from "../selector"
import type { Store } from "../store"
import { setAtom } from "./set-atom"

export const setAtomOrSelector = <T>(
	state: Atom<T> | Selector<T>,
	value: T | ((oldValue: T) => T),
	store: Store,
): void => {
	if (state.type === `selector`) {
		state.set(value)
	} else {
		setAtom(state, value, store)
	}
}
