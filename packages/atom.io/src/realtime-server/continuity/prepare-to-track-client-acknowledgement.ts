import type { Store } from "atom.io/internal"
import { setIntoStore } from "atom.io/internal"
import type { ContinuityToken } from "atom.io/realtime"

import type { UserKey } from "../realtime-server-stores"
import type { ContinuitySyncTransactionUpdate } from "./continuity-store"
import { userUnacknowledgedQueues } from "./continuity-store"

export function prepareToTrackClientAcknowledgement(
	store: Store,
	continuity: ContinuityToken,
	userKey: UserKey,
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
