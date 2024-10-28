import { findRelationsInStore } from "atom.io/data"
import {
	findInStore,
	getFromStore,
	IMPLICIT,
	subscribeToState,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { ContinuityToken } from "atom.io/realtime"

import type { ServerConfig, Socket } from ".."
import { socketAtoms, usersOfSockets } from ".."
import { userUnacknowledgedQueues } from "../realtime-server-stores"
import { prepareToSendInitialPayload } from "./prepare-to-send-initial-payload"
import { prepareToServeTransactionRequest } from "./prepare-to-serve-transaction-request"
import { prepareToTrackClientAcknowledgement } from "./prepare-to-track-client-acknowledgement"
import { subscribeToContinuityActions } from "./subscribe-to-continuity-actions"
import { subscribeToContinuityPerspectives } from "./subscribe-to-continuity-perpectives"

export type ExposeRealtimeContinuity = (
	continuity: ContinuityToken,
) => () => void
export function prepareToExposeRealtimeContinuity({
	socket: initialSocket,
	store = IMPLICIT.STORE,
}: ServerConfig): ExposeRealtimeContinuity {
	return function syncRealtimeContinuity(continuity) {
		let socket: Socket | null = initialSocket

		const continuityKey = continuity.key
		const userKeyState = findRelationsInStore(
			usersOfSockets,
			`socket::${socket.id}`,
			store,
		).userKeyOfSocket
		const userKey = getFromStore(store, userKeyState)
		if (!userKey) {
			store.logger.error(
				`❌`,
				`continuity`,
				continuityKey,
				`Tried to create a synchronizer for a socket (${socket.id}) that is not connected to a user.`,
			)
			return () => {}
		}

		const socketKeyState = findRelationsInStore(
			usersOfSockets,
			userKey,
			store,
		).socketKeyOfUser
		const unsubscribeFromSocketTracking = subscribeToState(
			socketKeyState,
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
				const newSocketState = findInStore(store, socketAtoms, newSocketKey)
				const newSocket = getFromStore(store, newSocketState)
				socket = newSocket
				for (const unacknowledgedUpdate of userUnacknowledgedUpdates) {
					socket?.emit(
						`tx-new:${continuityKey}`,
						unacknowledgedUpdate as Json.Serializable,
					)
				}
			},
			`sync-continuity:${continuityKey}:${userKey}`,
			store,
		)

		const userUnacknowledgedUpdates = getFromStore(
			store,
			userUnacknowledgedQueues,
			userKey,
		)

		const unsubscribeFunctions: (() => void)[] = []

		const unsubscribeFromPerspectives = subscribeToContinuityPerspectives(
			store,
			continuity,
			userKey,
			socket,
		)
		const unsubscribeFromTransactions = subscribeToContinuityActions(
			store,
			continuity,
			userKey,
			socket,
		)
		unsubscribeFunctions.push(
			...unsubscribeFromPerspectives,
			...unsubscribeFromTransactions,
		)

		const sendInitialPayload = prepareToSendInitialPayload(
			store,
			continuity,
			userKey,
			initialSocket,
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
			userUnacknowledgedUpdates,
		)

		socket?.on(`ack:${continuityKey}`, trackClientAcknowledgement)

		return () => {
			// clearInterval(retryTimeout)
			for (const unsubscribe of unsubscribeFunctions) unsubscribe()
			socket?.off(`ack:${continuityKey}`, trackClientAcknowledgement)
			socket?.off(`get:${continuityKey}`, sendInitialPayload)
			socket?.off(`tx-run:${continuityKey}`, fillTransactionRequest)
		}
	}
}
