import type { StateUpdate } from "atom.io"

import type { Atom, Selector, Store } from ".."

export const dispatchStateUpdate = <T>(
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
		case `atom`:
		case `writable_pure_selector`:
		case `readonly_pure_selector`:
		case `writable_held_selector`:
		case `readonly_held_selector`:
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
