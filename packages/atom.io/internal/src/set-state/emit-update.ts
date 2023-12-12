import type { StateUpdate } from "atom.io"

import type { Atom } from "../atom"
import type { ReadonlySelector, Selector } from "../selector"
import type { Store } from "../store"

export const emitUpdate = <T>(
	state: Atom<T> | ReadonlySelector<T> | Selector<T>,
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
