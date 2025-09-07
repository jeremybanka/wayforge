import { getFromStore, IMPLICIT } from "atom.io/internal"
import type { ContinuityToken } from "atom.io/realtime"

import type { ServerConfig, UserKey } from ".."
import { prepareToSendInitialPayload } from "./prepare-to-send-initial-payload"
import { prepareToServeTransactionRequest } from "./prepare-to-serve-transaction-request"
import { prepareToTrackClientAcknowledgement } from "./prepare-to-track-client-acknowledgement"
import { subscribeToContinuityActions } from "./subscribe-to-continuity-actions"
import { subscribeToContinuityPerspectives } from "./subscribe-to-continuity-perspectives"
import { employSocket } from "../employ-socket"
import { userUnacknowledgedUpdatesAtoms } from "./continuity-store"
import { Json } from "atom.io/json"

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

		const coreSubscriptions = new Set<() => void>()
		const socketSubscriptions = new Set<() => void>()
		const clearSubscriptions = (subscriptions: Set<() => void>) => {
			for (const unsubscribe of subscriptions) unsubscribe()
			subscriptions.clear()
		}

		const perspectiveSubscriptions = subscribeToContinuityPerspectives(
			store,
			continuity,
			userKey,
			socket,
		)
		for (const unsubscribe of perspectiveSubscriptions)
			coreSubscriptions.add(unsubscribe)
		const actionSubscriptions = subscribeToContinuityActions(
			store,
			continuity,
			userKey,
			socket,
		)
		for (const unsubscribe of actionSubscriptions)
			coreSubscriptions.add(unsubscribe)

		const sendInitialPayload = prepareToSendInitialPayload(
			store,
			continuity,
			userKey,
			socket,
		)

		socketSubscriptions.add(
			employSocket(socket, `get:${continuityKey}`, sendInitialPayload),
		)

		const fillTransactionRequest = prepareToServeTransactionRequest(
			store,
			continuity,
			userKey,
		)

		socketSubscriptions.add(
			employSocket(socket, `tx-run:${continuityKey}`, fillTransactionRequest),
		)

		const trackClientAcknowledgement = prepareToTrackClientAcknowledgement(
			store,
			continuity,
			userKey,
		)

		socketSubscriptions.add(
			employSocket(socket, `ack:${continuityKey}`, trackClientAcknowledgement),
		)

		return () => {
			clearSubscriptions(coreSubscriptions)
			clearSubscriptions(socketSubscriptions)
		}
	}
}
