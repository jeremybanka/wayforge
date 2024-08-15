import type { TimelineToken } from "atom.io"

import {
	ingestAtomUpdate,
	ingestCreationEvent,
	ingestDisposalEvent,
	ingestMoleculeCreationEvent,
	ingestMoleculeDisposalEvent,
	ingestSelectorUpdate,
	ingestTransactionUpdate,
} from "../ingest-updates"
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

	const update = timelineData.history[timelineData.at]
	const applying = action === `redo` ? `newValue` : `oldValue`

	switch (update.type) {
		case `atom_update`: {
			ingestAtomUpdate(applying, update, store)
			break
		}
		case `selector_update`: {
			ingestSelectorUpdate(applying, update, store)
			break
		}
		case `transaction_update`: {
			ingestTransactionUpdate(applying, update, store)
			break
		}
		case `state_creation`: {
			ingestCreationEvent(update, applying, store)
			break
		}
		case `state_disposal`: {
			ingestDisposalEvent(update, applying, store)
			break
		}
		case `molecule_creation`: {
			ingestMoleculeCreationEvent(update, applying, store)
			break
		}
		case `molecule_disposal`: {
			ingestMoleculeDisposalEvent(update, applying, store)
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
