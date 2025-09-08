import type { Store } from "atom.io/internal"
import { getFromStore, setIntoStore } from "atom.io/internal"
import type { ContinuityToken } from "atom.io/realtime"

import { employSocket } from "../employ-socket"
import type { UserKey } from "../realtime-server-stores"
import type { Socket } from "../socket-interface"
import { userUnacknowledgedUpdatesAtoms } from "./continuity-store"

export function trackAcknowledgement(
	store: Store,
	socket: Socket,
	continuity: ContinuityToken,
	userKey: UserKey,
): () => void {
	const continuityKey = continuity.key
	const userUnacknowledgedUpdates = getFromStore(
		store,
		userUnacknowledgedUpdatesAtoms,
		userKey,
	)
	function trackClientAcknowledgement(epoch: number): void {
		store.logger.info(
			`👍`,
			`continuity`,
			continuityKey,
			`${userKey} acknowledged epoch ${epoch}`,
		)
		const isUnacknowledged = userUnacknowledgedUpdates[0]?.epoch === epoch
		if (isUnacknowledged) {
			setIntoStore(store, userUnacknowledgedUpdatesAtoms, userKey, (updates) => {
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
	return employSocket(socket, `ack:${continuityKey}`, trackClientAcknowledgement)
}
