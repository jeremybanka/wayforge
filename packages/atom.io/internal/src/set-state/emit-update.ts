import type { StateUpdate } from "atom.io"

import type { Atom, Selector, Store } from ".."

export const emitUpdate = <T>(
	state: Atom<T> | Selector<T>,
	update: StateUpdate<T>,
	store: Store,
): void => {
	store.logger.info(
		`📢`,
		state.type,
		state.key,
		`went (`,
		update.oldValue,
		`->`,
		update.newValue,
		`) subscribers:`,
		state.subject.subscribers,
	)
	state.subject.next(update)
}
