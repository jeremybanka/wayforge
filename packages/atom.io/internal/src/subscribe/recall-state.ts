import type { Atom } from "../atom"
import type { ReadonlySelector, Selector } from "../selector"
import type { Store } from "../store"
import { IMPLICIT } from "../store"
import { target } from "../transaction"

export const recallState = <T>(
	state: Atom<T> | ReadonlySelector<T> | Selector<T>,
	store: Store = IMPLICIT.STORE,
): T => {
	const core = target(store)
	if (!core.operation.open) {
		store.logger.warn(
			`🐞`,
			state.type,
			state.key,
			`recall called outside of an operation. This is probably a bug.`,
		)
		return core.valueMap.get(state.key)
	}
	return core.operation.prev.get(state.key)
}
