import type { Atom, OpenOperation, Store, WritableState } from ".."
import { traceRootSelectorAtoms } from ".."
import { isFn } from "../is-fn"
import { safeCompute } from "../safe-compute"
import { dispatchOrDeferStateUpdate } from "./dispatch-state-update"
import type { ProtoUpdate } from "./operate-on-store"
import { setAtom } from "./set-atom"

function resetAtom<T, E>(
	target: Store & { operation: OpenOperation },
	atom: Atom<T, E>,
): ProtoUpdate<E | T> {
	switch (atom.type) {
		case `mutable_atom`:
			return setAtom(target, atom, new atom.class())
		case `atom`: {
			let def: E | T
			if (isFn(atom.default)) def = safeCompute(target, atom)
			else def = atom.default
			return setAtom<E | T>(target, atom, def)
		}
	}
}

export function resetAtomOrSelector<T, E>(
	target: Store & { operation: OpenOperation },
	state: WritableState<T, E>,
): ProtoUpdate<E | T> {
	let protoUpdate: ProtoUpdate<E | T>
	switch (state.type) {
		case `atom`:
		case `mutable_atom`:
			protoUpdate = resetAtom(target, state)
			break
		case `writable_held_selector`:
			{
				const atoms = traceRootSelectorAtoms(target, state.key)
				for (const atom of atoms.values()) {
					const rootProtoUpdate = resetAtom(target, atom)
					dispatchOrDeferStateUpdate(target, state, rootProtoUpdate, false)
				}
				const value = state.getFrom(target)
				protoUpdate = { oldValue: value, newValue: value }
			}
			break
		case `writable_pure_selector`:
			{
				const oldValue = safeCompute(target, state)
				const atoms = traceRootSelectorAtoms(target, state.key)
				for (const atom of atoms.values()) {
					const rootProtoUpdate = resetAtom(target, atom)
					dispatchOrDeferStateUpdate(target, state, rootProtoUpdate, false)
				}
				const newValue = safeCompute(target, state)
				protoUpdate = { oldValue, newValue }
			}
			break
	}

	return protoUpdate
}
