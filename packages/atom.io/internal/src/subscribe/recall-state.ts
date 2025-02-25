import type { ReadableState } from ".."
import { newest } from "../lineage"
import type { Store } from "../store"

export const recallState = <T>(store: Store, state: ReadableState<T>): T => {
	const target = newest(store)
	if (target.operation.open) {
		return target.operation.prev.get(state.key)
	}
	return target.valueMap.get(state.key)
}
