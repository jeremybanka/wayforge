import type { Atom } from "../atom"
import { newest } from "../lineage"
import type { ReadonlySelector, Selector } from "../selector"
import type { Store } from "../store"

export const recallState = <T>(
	state: Atom<T> | ReadonlySelector<T> | Selector<T>,
	store: Store,
): T => {
	const target = newest(store)
	if (!target.operation.open) {
		store.logger.warn(
			`🐞`,
			state.type,
			state.key,
			`recall called outside of an operation. This is probably a bug.`,
		)
		return target.valueMap.get(state.key)
	}
	return target.operation.prev.get(state.key)
}
