import { getFromStore, IMPLICIT } from "atom.io/internal"
import type { ContinuityToken } from "atom.io/realtime"

import type { ServerConfig, UserKey } from ".."
import { serveStartupRequests } from "./prepare-to-send-initial-payload"
import { trackAcknowledgement } from "./prepare-to-track-client-acknowledgement"
import { trackOutcomes } from "./subscribe-to-continuity-actions"
import { trackPerspectives } from "./subscribe-to-continuity-perspectives"
import { userUnacknowledgedUpdatesAtoms } from "./continuity-store"
import { Json } from "atom.io/json"
import { serveActionRequests } from "./prepare-to-serve-transaction-request"

export type ExposeRealtimeContinuity = (
	continuity: ContinuityToken,
	userKey: UserKey,
) => () => void
export function prepareToExposeRealtimeContinuity({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig): ExposeRealtimeContinuity {
	return function syncRealtimeContinuity(continuity, userKey) {
		const continuityKey = continuity.key
		const unacknowledgedUpdates = getFromStore(
			store,
			userUnacknowledgedUpdatesAtoms,
			userKey,
		)
		for (const unacknowledgedUpdate of unacknowledgedUpdates) {
			socket.emit(
				`tx-new:${continuityKey}`,
				unacknowledgedUpdate as Json.Serializable,
			)
		}

		const subscriptions = new Set<() => void>()
		const clearSubscriptions = () => {
			for (const unsubscribe of subscriptions) unsubscribe()
			subscriptions.clear()
		}

		subscriptions.add(trackPerspectives(store, socket, continuity, userKey))
		subscriptions.add(trackOutcomes(store, socket, continuity, userKey))
		subscriptions.add(serveStartupRequests(store, socket, continuity, userKey))
		subscriptions.add(serveActionRequests(store, socket, continuity, userKey))
		subscriptions.add(trackAcknowledgement(store, socket, continuity, userKey))

		return clearSubscriptions
	}
}
