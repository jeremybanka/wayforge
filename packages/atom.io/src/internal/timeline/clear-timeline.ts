import type { TimelineToken } from "atom.io"

import type { Store } from "../store"

export function clearTimelineInStore(
	store: Store,
	token: TimelineToken<any>,
): void {
	store.logger.info(`🧹`, `timeline`, token.key, `clear`)
	const timelineData = store.timelines.get(token.key)
	if (!timelineData) {
		store.logger.error(
			`🐞`,
			`timeline`,
			token.key,
			`Failed to clear. This timeline has not been initialized.`,
		)
		return
	}
	timelineData.at = 0
	timelineData.history = []
	timelineData.selectorTime = null
	timelineData.timeTraveling = null
	timelineData.transactionKey = null
	timelineData.subject.next({
		type: `timeline_update`,
		event: `clear`,
		at: 0,
		length: 0,
	})
	store.logger.info(
		`🧼`,
		`timeline`,
		token.key,
		`"${token.key}" is now at 0 / 0`,
	)
}
