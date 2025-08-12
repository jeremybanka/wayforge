import type { StateUpdate } from "atom.io"

import type { WritableState } from ".."
import type { Store } from "../store"
import { setAtom } from "./set-atom"

export const setAtomOrSelector = <T>(
	store: Store,
	state: WritableState<T>,
	value: T | ((oldValue: T) => T),
): StateUpdate<T> => {
	let update: StateUpdate<T>
	switch (state.type) {
		case `atom`:
		case `mutable_atom`:
			update = setAtom(store, state, value)
			break
		case `writable_pure_selector`:
		case `writable_held_selector`:
			update = state.set(value)
	}
	return update
}
