import type { TimelineToken } from "atom.io"

import {
	ingestAtomUpdateEvent,
	ingestCreationEvent,
	ingestDisposalEvent,
	ingestSelectorUpdateEvent,
	ingestTransactionOutcomeEvent,
} from "../events"
import type { Store } from "../store"

export const timeTravel = (
	store: Store,
	action: `redo` | `undo`,
	token: TimelineToken<any>,
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

	const event = timelineData.history[timelineData.at]
	const applying = action === `redo` ? `newValue` : `oldValue`

	switch (event.type) {
		case `atom_update`: {
			ingestAtomUpdateEvent(store, event, applying)
			break
		}
		case `selector_update`: {
			ingestSelectorUpdateEvent(store, event, applying)
			break
		}
		case `transaction_outcome`: {
			ingestTransactionOutcomeEvent(store, event, applying)
			break
		}
		case `state_creation`: {
			ingestCreationEvent(store, event, applying)
			break
		}
		case `state_disposal`: {
			ingestDisposalEvent(store, event, applying)
			break
		}
		case `molecule_creation`:
		case `molecule_disposal`:
	}

	if (action === `redo`) {
		++timelineData.at
	}

	timelineData.subject.next(action)
	timelineData.timeTraveling = null
	store.logger.info(
		`⏸️`,
		`timeline`,
		token.key,
		`"${token.key}" is now at ${timelineData.at} / ${timelineData.history.length}`,
	)
}
