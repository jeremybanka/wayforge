import type { StateUpdate } from "atom.io"

import type { Atom, Selector, Store } from ".."

export const emitUpdate = <T>(
	store: Store,
	state: Atom<T> | Selector<T>,
	update: StateUpdate<T>,
): void => {
	switch (state.type) {
		case `mutable_atom`:
			store.logger.info(
				`📢`,
				state.type,
				state.key,
				`is now (`,
				update.newValue,
				`) subscribers:`,
				state.subject.subscribers,
			)
			break
		default:
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
	}
	state.subject.next(update)
}
