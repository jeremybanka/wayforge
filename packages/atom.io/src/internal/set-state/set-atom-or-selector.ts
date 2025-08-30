import type { OpenOperation } from "../operation"
import type { WritableState } from "../state-types"
import type { Store } from "../store"
import type { ProtoUpdate } from "./operate-on-store"
import { setAtom } from "./set-atom"
import { setSelector } from "./set-selector"

export const setAtomOrSelector = <T>(
	target: Store & { operation: OpenOperation },
	state: WritableState<T, any>,
	value: NoInfer<T> | ((oldValue: T) => NoInfer<T>),
): ProtoUpdate<T> => {
	let protoUpdate: ProtoUpdate<T>
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
