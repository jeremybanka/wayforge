import type { ReadableState } from ".."
import { newest } from "../lineage"
import type { Store } from "../store"

export const recallState = <T>(state: ReadableState<T>, store: Store): T => {
	const target = newest(store)
	if (!target.operation.open) {
		return target.valueMap.get(state.key)
	}
	return target.operation.prev.get(state.key)
}
