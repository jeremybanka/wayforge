import type { StateUpdate } from "atom.io"

import type { Atom, WritableState } from ".."
import { readOrComputeValue, traceRootSelectorAtoms } from ".."
import type { Store } from "../store"
import { setAtom } from "./set-atom"

function resetAtom<T>(store: Store, state: Atom<T>): StateUpdate<T> {
	switch (state.type) {
		case `mutable_atom`:
			return setAtom(store, state, new state.class())
		case `atom`: {
			let def = state.default
			if (def instanceof Function) {
				def = def()
			}
			return setAtom(store, state, def)
		}
	}
}

export function resetAtomOrSelector<T>(
	store: Store,
	state: WritableState<T>,
): StateUpdate<T> {
	switch (state.type) {
		case `atom`:
		case `mutable_atom`:
			return resetAtom(store, state)
		case `writable_pure_selector`:
		case `writable_held_selector`: {
			const oldValue = readOrComputeValue(store, state) as T
			const atoms = traceRootSelectorAtoms(store, state.key)
			for (const atom of atoms.values()) {
				resetAtom(store, atom)
			}
			const newValue = readOrComputeValue(store, state) as T
			return { oldValue, newValue }
		}
	}
}
