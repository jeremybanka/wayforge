import type { TimelineToken } from "atom.io"
import { setState } from "atom.io"

import type { Store } from "../store"
import { IMPLICIT } from "../store"

export const redo__INTERNAL = (
	token: TimelineToken,
	store: Store = IMPLICIT.STORE,
): void => {
	store.logger.info(`⏩`, `timeline`, token.key, `redo`)
	const timelineData = store.timelines.get(token.key)
	if (!timelineData) {
		store.logger.error(
			`🐞`,
			`timeline`,
			token.key,
			`Failed to redo. This timeline has not been initialized.`,
		)
		return
	}
	if (timelineData.at === timelineData.history.length) {
		store.logger.warn(
			`💁`,
			`timeline`,
			token.key,
			`Failed to redo at the end of timeline "${token.key}". There is nothing to redo.`,
		)
		return
	}
	timelineData.timeTraveling = `into_future`
	const update = timelineData.history[timelineData.at]
	switch (update.type) {
		case `atom_update`: {
			const { key, newValue } = update
			setState({ key, type: `atom` }, newValue, store)
			break
		}
		case `selector_update`:
		case `transaction_update`: {
			for (const atomUpdate of update.atomUpdates) {
				const { key, newValue } = atomUpdate
				setState({ key, type: `atom` }, newValue, store)
			}
			break
		}
	}
	++timelineData.at
	timelineData.subject.next(`redo`)
	timelineData.timeTraveling = null
	store.logger.info(
		`⏹️`,
		`timeline`,
		token.key,
		`"${token.key}" is now at ${timelineData.at} / ${timelineData.history.length}`,
	)
}

export const undo__INTERNAL = (
	token: TimelineToken,
	store: Store = IMPLICIT.STORE,
): void => {
	store.logger.info(`⏪`, `timeline`, token.key, `undo`)
	const timelineData = store.timelines.get(token.key)
	if (!timelineData) {
		store.logger.error(
			`🐞`,
			`timeline`,
			token.key,
			`Failed to undo. This timeline has not been initialized.`,
		)
		return
	}
	if (timelineData.at === 0) {
		store.logger.warn(
			`💁`,
			`timeline`,
			token.key,
			`Failed to undo at the beginning of timeline "${token.key}". There is nothing to undo.`,
		)
		return
	}
	timelineData.timeTraveling = `into_past`
	--timelineData.at
	const update = timelineData.history[timelineData.at]
	switch (update.type) {
		case `atom_update`: {
			const { key, oldValue } = update
			setState({ key, type: `atom` }, oldValue, store)
			break
		}
		case `selector_update`:
		case `transaction_update`: {
			for (const atomUpdate of [...update.atomUpdates].reverse()) {
				const { key, oldValue } = atomUpdate
				setState({ key, type: `atom` }, oldValue, store)
			}
			break
		}
	}
	timelineData.subject.next(`undo`)
	timelineData.timeTraveling = null
	store.logger.info(
		`⏹️`,
		`timeline`,
		token.key,
		`"${token.key}" is now at ${timelineData.at} / ${timelineData.history.length}`,
	)
}
