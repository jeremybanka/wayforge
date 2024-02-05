import type { StateUpdate } from "atom.io"
import type { Store } from "atom.io/internal"

import type { Atom, Selector } from ".."

export const emitUpdate = <T>(
	state: Atom<T> | Selector<T>,
	update: StateUpdate<T>,
	store: Store,
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
