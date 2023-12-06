import type { KeyedStateUpdate, TimelineToken, TransactionUpdate } from "atom.io"
import { setState } from "atom.io"

import type { Store } from "../store"

export const timeTravel = (
	direction: `backward` | `forward`,
	token: TimelineToken,
	store: Store,
): void => {
	const action = direction === `forward` ? `redo` : `undo`
	store.logger.info(
		direction === `forward` ? `⏩` : `⏪`,
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
		(direction === `forward` &&
			timelineData.at === timelineData.history.length) ||
		(direction === `backward` && timelineData.at === 0)
	) {
		store.logger.warn(
			`💁`,
			`timeline`,
			token.key,
			`Failed to ${action} at the ${
				direction === `forward` ? `end` : `beginning`
			} of timeline "${token.key}". There is nothing to ${action}.`,
		)
		return
	}

	timelineData.timeTraveling =
		direction === `forward` ? `into_future` : `into_past`
	if (direction === `backward`) {
		--timelineData.at
	}

	const update = timelineData.history[timelineData.at]
	const updateValues = (atomUpdate: KeyedStateUpdate<any>) => {
		const { key, newValue, oldValue } = atomUpdate
		const value = direction === `forward` ? newValue : oldValue
		setState({ key, type: `atom` }, value, store)
	}
	const updateValuesFromTransactionUpdate = (
		transactionUpdate: TransactionUpdate<any>,
	) => {
		const updates =
			direction === `forward`
				? transactionUpdate.updates
				: [...transactionUpdate.updates].reverse()
		for (const updateFromTransaction of updates) {
			if (`newValue` in updateFromTransaction) {
				updateValues(updateFromTransaction)
			} else {
				updateValuesFromTransactionUpdate(updateFromTransaction)
			}
		}
	}

	switch (update.type) {
		case `atom_update`: {
			updateValues(update)
			break
		}
		case `selector_update`: {
			const updates =
				direction === `forward`
					? update.atomUpdates
					: [...update.atomUpdates].reverse()
			for (const atomUpdate of updates) {
				updateValues(atomUpdate)
			}
			break
		}
		case `transaction_update`: {
			updateValuesFromTransactionUpdate(update)
			break
		}
	}

	if (direction === `forward`) {
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
