import type { TimelineManageable, TimelineToken, TimelineUpdate } from "atom.io"
import type { Store } from ".."
import { withdraw } from ".."

export const subscribeToTimeline = <ManagedAtom extends TimelineManageable>(
	token: TimelineToken<ManagedAtom>,
	handleUpdate: (update: TimelineUpdate<any> | `redo` | `undo`) => void,
	key: string,
	store: Store,
): (() => void) => {
	const tl = withdraw(token, store)
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
