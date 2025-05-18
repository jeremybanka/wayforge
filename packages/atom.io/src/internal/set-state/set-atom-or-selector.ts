import type { WritableState } from ".."
import type { Store } from "../store"
import { setAtom } from "./set-atom"

export const setAtomOrSelector = <T>(
	store: Store,
	state: WritableState<T>,
	value: T | ((oldValue: T) => T),
): void => {
	switch (state.type) {
		case `atom`:
		case `mutable_atom`:
			setAtom(store, state, value)
			break
		case `writable_pure_selector`:
		case `writable_held_selector`:
			state.set(value)
			break
	}
}
