import type { KeyedStateUpdate, TimelineToken, TransactionUpdate } from "atom.io"
import { setState } from "atom.io"

import type { Store } from "../store"
import type { TimelineSelectorUpdate } from "./create-timeline"

export const timeTravel = (
	action: `redo` | `undo`,
	token: TimelineToken<any>,
	store: Store,
): void => {
	store.logger.info(
		action === `redo` ? `⏩` : `⏪`,
		`timeline`,
		token.key,
		action,
	)
	const timelineData = store.timelines.get(token.key)
	if (!timelineData) {
		store.logger.error(
			`🐞`,
			`timeline`,
			token.key,
			`Failed to ${action}. This timeline has not been initialized.`,
		)
		return
	}
	if (
		(action === `redo` && timelineData.at === timelineData.history.length) ||
		(action === `undo` && timelineData.at === 0)
	) {
		store.logger.warn(
			`💁`,
			`timeline`,
			token.key,
			`Failed to ${action} at the ${
				action === `redo` ? `end` : `beginning`
			} of timeline "${token.key}". There is nothing to ${action}.`,
		)
		return
	}

	timelineData.timeTraveling = action === `redo` ? `into_future` : `into_past`
	if (action === `undo`) {
		--timelineData.at
	}

	const update = timelineData.history[timelineData.at]
	const applying = action === `redo` ? `newValue` : `oldValue`

	switch (update.type) {
		case `atom_update`: {
			applyAtomUpdate(applying, update, store)
			break
		}
		case `selector_update`: {
			applySelectorUpdate(applying, update, store)
			break
		}
		case `transaction_update`: {
			applyTransactionUpdate(applying, update, store)
			break
		}
	}

	if (action === `redo`) {
		++timelineData.at
	}

	timelineData.subject.next(action)
	timelineData.timeTraveling = null
	store.logger.info(
		`⏹️`,
		`timeline`,
		token.key,
		`"${token.key}" is now at ${timelineData.at} / ${timelineData.history.length}`,
	)
}

function applyAtomUpdate(
	applying: `newValue` | `oldValue`,
	atomUpdate: KeyedStateUpdate<any>,
	store: Store,
) {
	const { key, newValue, oldValue } = atomUpdate
	const value = applying === `newValue` ? newValue : oldValue
	setState({ key, type: `atom` }, value, store)
}
function applySelectorUpdate(
	applying: `newValue` | `oldValue`,
	selectorUpdate: TimelineSelectorUpdate<any>,
	store: Store,
) {
	const updates =
		applying === `newValue`
			? selectorUpdate.atomUpdates
			: [...selectorUpdate.atomUpdates].reverse()
	for (const atomUpdate of updates) {
		applyAtomUpdate(applying, atomUpdate, store)
	}
}
function applyTransactionUpdate(
	applying: `newValue` | `oldValue`,
	transactionUpdate: TransactionUpdate<any>,
	store: Store,
) {
	const updates =
		applying === `newValue`
			? transactionUpdate.updates
			: [...transactionUpdate.updates].reverse()
	for (const updateFromTransaction of updates) {
		if (`newValue` in updateFromTransaction) {
			applyAtomUpdate(applying, updateFromTransaction, store)
		} else {
			applyTransactionUpdate(applying, updateFromTransaction, store)
		}
	}
}
