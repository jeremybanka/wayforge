import type { Atom } from "../atom"
import type { Selector } from "../selector"
import type { Store } from "../store"
import { setAtom } from "./set-atom"

export const setAtomOrSelector = <T>(
	state: Atom<T> | Selector<T>,
	value: T | ((oldValue: T) => T),
	store: Store,
): void => {
	switch (state.type) {
		case `atom`:
			setAtom(state, value, store)
			break
		case `selector`:
			state.set(value)
			break
	}
}
