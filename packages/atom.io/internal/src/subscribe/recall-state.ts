import type { Atom } from "../atom"
import { newest } from "../lineage"
import type { ReadonlySelector, WritableSelector } from "../selector"
import type { Store } from "../store"

export const recallState = <T>(
	state: Atom<T> | ReadonlySelector<T> | WritableSelector<T>,
	store: Store,
): T => {
	const target = newest(store)
	if (!target.operation.open) {
		return target.valueMap.get(state.key)
	}
	return target.operation.prev.get(state.key)
}
