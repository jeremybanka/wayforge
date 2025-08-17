import type { WritableState } from ".."
import type { OpenOperation } from "../operation"
import type { Store } from "../store"
import { dispatchOrDeferStateUpdate } from "./dispatch-state-update"
import { setAtom } from "./set-atom"
import { setSelector } from "./set-selector"

export const setAtomOrSelector = <T>(
	target: Store & { operation: OpenOperation },
	state: WritableState<T>,
	value: T | ((oldValue: T) => T),
): [oldValue: T, newValue: T] => {
	let protoUpdate: [T, T]
	switch (state.type) {
		case `atom`:
		case `mutable_atom`:
			protoUpdate = setAtom(target, state, value)
			break
		case `writable_pure_selector`:
		case `writable_held_selector`:
			protoUpdate = setSelector(target, state, value)
			break
	}

	return protoUpdate
}
