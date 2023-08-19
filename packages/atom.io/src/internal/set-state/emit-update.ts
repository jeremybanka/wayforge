import type { Store, ReadonlySelector, Selector } from ".."
import type { StateUpdate } from "../.."
import type { Atom } from "../atom"

export const emitUpdate = <T>(
	state: Atom<T> | ReadonlySelector<T> | Selector<T>,
	update: StateUpdate<T>,
	store: Store,
): void => {
	const { key } = state
	const { logger } = store.config
	logger?.info(
		`📢 ${state.type} "${key}" went (`,
		update.oldValue,
		`->`,
		update.newValue,
		`)`,
	)
	state.subject.next(update)
}
