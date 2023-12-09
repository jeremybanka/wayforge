import type { TimelineToken, TimelineUpdate } from "atom.io"
import type { Store } from "atom.io/internal"
import { withdraw } from "atom.io/internal"

export const subscribeToTimeline = (
	token: TimelineToken,
	handleUpdate: (update: TimelineUpdate | `redo` | `undo`) => void,
	key: string,
	store: Store,
): (() => void) => {
	const tl = withdraw(token, store)
	if (tl === undefined) {
		throw new Error(
			`Cannot subscribe to timeline "${token.key}": timeline not found in store "${store.config.name}".`,
		)
	}
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
