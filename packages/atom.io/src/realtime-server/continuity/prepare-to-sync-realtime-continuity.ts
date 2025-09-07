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

		const subscriptions: (() => void)[] = []

		subscriptions.push(
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
					for (const unacknowledgedUpdate of userUnacknowledgedUpdates) {
						socket?.emit(
							`tx-new:${continuityKey}`,
							unacknowledgedUpdate as Json.Serializable,
						)
					}
				},
			),
		)

		subscriptions.push(
			...subscribeToContinuityPerspectives(store, continuity, userKey, socket),
		)
		subscriptions.push(
			...subscribeToContinuityActions(store, continuity, userKey, socket),
		)

		const sendInitialPayload = prepareToSendInitialPayload(
			store,
			continuity,
			userKey,
			socket,
		)

		socket.off(`get:${continuityKey}`, sendInitialPayload)
		socket.on(`get:${continuityKey}`, sendInitialPayload)

		const fillTransactionRequest = prepareToServeTransactionRequest(
			store,
			continuity,
			userKey,
		)

		socket.off(`tx-run:${continuityKey}`, fillTransactionRequest)
		socket.on(`tx-run:${continuityKey}`, fillTransactionRequest)

		const trackClientAcknowledgement = prepareToTrackClientAcknowledgement(
			store,
			continuity,
			userKey,
		)

		socket?.on(`ack:${continuityKey}`, trackClientAcknowledgement)

		return () => {
			for (const unsubscribe of subscriptions) unsubscribe()
			socket?.off(`ack:${continuityKey}`, trackClientAcknowledgement)
			socket?.off(`get:${continuityKey}`, sendInitialPayload)
			socket?.off(`tx-run:${continuityKey}`, fillTransactionRequest)
		}
	}
}
