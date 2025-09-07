import {
	findInStore,
	findRelationsInStore,
	getFromStore,
	IMPLICIT,
	subscribeToState,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { ContinuityToken } from "atom.io/realtime"

import type { ServerConfig, Socket, UserKey } from ".."
import { socketAtoms, usersOfSockets } from ".."
import { userUnacknowledgedUpdatesAtoms } from "./continuity-store"
import { prepareToSendInitialPayload } from "./prepare-to-send-initial-payload"
import { prepareToServeTransactionRequest } from "./prepare-to-serve-transaction-request"
import { prepareToTrackClientAcknowledgement } from "./prepare-to-track-client-acknowledgement"
import { subscribeToContinuityActions } from "./subscribe-to-continuity-actions"
import { subscribeToContinuityPerspectives } from "./subscribe-to-continuity-perspectives"
import { employSocket } from "../employ-socket"

export type ExposeRealtimeContinuity = (
	continuity: ContinuityToken,
	userKey: UserKey,
) => () => void
export function prepareToExposeRealtimeContinuity({
	socket: initialSocket,
	store = IMPLICIT.STORE,
}: ServerConfig): ExposeRealtimeContinuity {
	return function syncRealtimeContinuity(continuity, userKey) {
		let socket: Socket | null = initialSocket

		const continuityKey = continuity.key

		const socketKeyState = findRelationsInStore(
			usersOfSockets,
			userKey,
			store,
		).socketKeyOfUser

		const coreSubscriptions = new Set<() => void>()
		const socketSubscriptions = new Set<() => void>()
		const clearSubscriptions = (subscriptions: Set<() => void>) => {
			for (const unsubscribe of subscriptions) unsubscribe()
			subscriptions.clear()
		}

		coreSubscriptions.add(
			subscribeToState(
				store,
				socketKeyState,
				`sync-continuity:${continuityKey}:${userKey}`,
				({ newValue: newSocketKey }) => {
					store.logger.info(
						`👋`,
						`continuity`,
						continuityKey,
						`seeing ${userKey} on new socket ${newSocketKey}`,
					)
					if (newSocketKey === null) {
						store.logger.warn(
							`❌`,
							`continuity`,
							continuityKey,
							`User (${userKey}) is not connected to a socket, waiting for them to reappear.`,
						)
						return
					}
					socket = getFromStore(store, socketAtoms, newSocketKey)
					const unacknowledgedUpdates = getFromStore(
						store,
						userUnacknowledgedUpdatesAtoms,
						userKey,
					)
					for (const unacknowledgedUpdate of unacknowledgedUpdates) {
						socket?.emit(
							`tx-new:${continuityKey}`,
							unacknowledgedUpdate as Json.Serializable,
						)
					}
				},
			),
		)

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
