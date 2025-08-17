import type { TimelineEvent, TimelineManageable, TimelineToken } from "atom.io"

import type { Store } from "../store/store"
import { withdraw } from "../store/withdraw"

export const subscribeToTimeline = <ManagedAtom extends TimelineManageable>(
	store: Store,
	token: TimelineToken<ManagedAtom>,
	key: string,
	handleUpdate: (update: TimelineEvent<any> | `redo` | `undo`) => void,
): (() => void) => {
	const tl = withdraw(store, token)
	store.logger.info(`👀`, `timeline`, token.key, `Adding subscription "${key}"`)
	const unsubscribe = tl.subject.subscribe(key, handleUpdate)
	return () => {
		store.logger.info(
			`🙈`,
			`timeline`,
			token.key,
			`Removing subscription "${key}" from timeline`,
		)
		unsubscribe()
	}
}
