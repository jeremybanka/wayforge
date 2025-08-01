import type { Atom, WritableState } from ".."
import { traceRootSelectorAtoms } from ".."
import type { Store } from "../store"
import { setAtom } from "./set-atom"

function resetAtom(store: Store, state: Atom<any>) {
	let def = state.default
	if (def instanceof Function) {
		def = def()
	}
	setAtom(store, state, def)
}

export function resetAtomOrSelector(
	store: Store,
	state: WritableState<any>,
): void {
	switch (state.type) {
		case `atom`:
		case `mutable_atom`:
			resetAtom(store, state)
			break
		case `writable_pure_selector`:
		case `writable_held_selector`:
			{
				const atoms = traceRootSelectorAtoms(store, state.key)
				for (const atom of atoms.values()) {
					resetAtom(store, atom)
				}
			}
			break
	}
}
