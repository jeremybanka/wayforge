import type { Store } from "atom.io/internal"
import { setIntoStore } from "atom.io/internal"
import type { ContinuityToken } from "atom.io/realtime"

import { userUnacknowledgedQueues } from "../realtime-server-stores"
import type { TransactionResponse } from "./prepare-to-serve-transaction-request"

export function prepareToTrackClientAcknowledgement(
	store: Store,
	continuity: ContinuityToken,
	userKey: string,
	userUnacknowledgedUpdates: TransactionResponse[],
): (epoch: number) => void {
	const continuityKey = continuity.key
	return function trackClientAcknowledgement(epoch) {
		store.logger.info(
			`👍`,
			`continuity`,
			continuityKey,
			`${userKey} acknowledged epoch ${epoch}`,
		)
		const isUnacknowledged = userUnacknowledgedUpdates[0]?.epoch === epoch
		if (isUnacknowledged) {
			setIntoStore(store, userUnacknowledgedQueues, userKey, (updates) => {
				updates.shift()
				store.logger.info(
					`👍`,
					`continuity`,
					continuityKey,
					`${userKey} unacknowledged update queue now has`,
					updates.length,
					`items`,
				)
				return updates
			})
		}
	}
}
