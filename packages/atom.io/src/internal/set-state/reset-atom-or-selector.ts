import type { AtomToken, WritableToken } from "atom.io"

import { traceRootSelectorAtoms, withdraw } from ".."
import type { Store } from "../store"
import { setAtom } from "./set-atom"

function resetAtom(target: Store, token: AtomToken<any>) {
	const atom = withdraw(target, token)
	switch (atom.type) {
		case `mutable_atom`:
			setAtom(target, atom, new atom.class())
			return
		case `atom`: {
			let def = atom.default
			if (def instanceof Function) {
				def = def()
			}
			setAtom(target, atom, def)
		}
	}
}

export function resetAtomOrSelector(
	store: Store,
	token: WritableToken<any>,
): void {
	switch (token.type) {
		case `atom`:
		case `mutable_atom`:
			resetAtom(store, token)
			break
		case `writable_pure_selector`:
		case `writable_held_selector`:
			{
				const atoms = traceRootSelectorAtoms(store, token.key)
				for (const atom of atoms.values()) {
					resetAtom(store, atom)
				}
			}
			break
	}
}
