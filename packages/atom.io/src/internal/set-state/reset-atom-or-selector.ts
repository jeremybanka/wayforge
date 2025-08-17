import type { Atom, OpenOperation, Store, WritableState } from ".."
import { traceRootSelectorAtoms } from ".."
import { dispatchOrDeferStateUpdate } from "./dispatch-state-update"
import { setAtom } from "./set-atom"

function resetAtom<T>(
	target: Store & { operation: OpenOperation },
	atom: Atom<T>,
): [oldValue: T, newValue: T] {
	switch (atom.type) {
		case `mutable_atom`:
			return setAtom(target, atom, new atom.class())
		case `atom`: {
			let def = atom.default
			if (def instanceof Function) {
				def = def()
			}
			return setAtom(target, atom, def)
		}
	}
}

export function resetAtomOrSelector<T>(
	target: Store & { operation: OpenOperation },
	state: WritableState<T>,
): void {
	switch (state.type) {
		case `atom`:
		case `mutable_atom`:
			{
				const protoUpdate = resetAtom(target, state)
				dispatchOrDeferStateUpdate(target, state, protoUpdate)
			}
			break
		case `writable_pure_selector`:
		case `writable_held_selector`:
			{
				const oldValue = state.getFrom(target)
				const atoms = traceRootSelectorAtoms(target, state.key)
				for (const atom of atoms.values()) {
					const protoUpdate = resetAtom(target, atom)
					dispatchOrDeferStateUpdate(target, state, protoUpdate)
				}
				const newValue = state.getFrom(target)
				dispatchOrDeferStateUpdate(target, state, [oldValue, newValue])
			}
			break
	}
}
