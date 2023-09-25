import type { StateUpdate } from "atom.io"
import type { Store } from "atom.io/internal"

import type { Atom } from "../atom"
import type { ReadonlySelector, Selector } from "../selector"

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
	logger?.info(`📢 notifying subscribers:`, state.subject.subscribers)
	state.subject.next(update)
}
