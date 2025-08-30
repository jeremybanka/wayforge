import { newest } from "../lineage"
import type { ReadableState } from "../state-types"
import type { Store } from "../store"

export const recallState = <T, E>(
	store: Store,
	state: ReadableState<T, E>,
): T => {
	const target = newest(store)
	if (target.operation.open) {
		return target.operation.prev.get(state.key)
	}
	return target.valueMap.get(state.key)
}
