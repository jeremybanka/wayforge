import type { Atom, OpenOperation, Store, WritableState } from ".."
import { traceRootSelectorAtoms } from ".."
import { dispatchOrDeferStateUpdate } from "./dispatch-state-update"
import type { ProtoUpdate } from "./operate-on-store"
import { setAtom } from "./set-atom"

function resetAtom<T>(
	target: Store & { operation: OpenOperation },
	atom: Atom<T>,
): ProtoUpdate<T> {
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
): ProtoUpdate<T> {
	let protoUpdate: ProtoUpdate<T>
	switch (state.type) {
		case `atom`:
		case `mutable_atom`:
			protoUpdate = resetAtom(target, state)
			break
		case `writable_pure_selector`:
		case `writable_held_selector`:
			{
				const oldValue = state.getFrom(target)
				const atoms = traceRootSelectorAtoms(target, state.key)
				for (const atom of atoms.values()) {
					const rootProtoUpdate = resetAtom(target, atom)
					dispatchOrDeferStateUpdate(target, state, rootProtoUpdate, false)
				}
				const newValue = state.getFrom(target)
				protoUpdate = { oldValue, newValue }
			}
			break
	}

	return protoUpdate
}
