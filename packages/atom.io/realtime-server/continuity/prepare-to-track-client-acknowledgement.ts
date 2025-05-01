import type { Store } from "atom.io/internal"
import { setIntoStore } from "atom.io/internal"
import type { ContinuityToken } from "atom.io/realtime"

import type { ContinuitySyncTransactionUpdate } from "../realtime-server-stores"
import { userUnacknowledgedQueues } from "../realtime-server-stores"

export function prepareToTrackClientAcknowledgement(
	store: Store,
	continuity: ContinuityToken,
	userKey: string,
	userUnacknowledgedUpdates: ContinuitySyncTransactionUpdate[],
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
