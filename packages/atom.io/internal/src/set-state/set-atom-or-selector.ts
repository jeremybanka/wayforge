import type { WritableState } from ".."
import type { Store } from "../store"
import { setAtom } from "./set-atom"

export const setAtomOrSelector = <T>(
	state: WritableState<T>,
	value: T | ((oldValue: T) => T),
	store: Store,
): void => {
	switch (state.type) {
		case `atom`:
		case `mutable_atom`:
			setAtom(state, value, store)
			break
		case `selector`:
			state.set(value)
			break
	}
}
