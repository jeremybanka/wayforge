import type * as AtomIO from "atom.io"
import {
	IMPLICIT,
	actUponStore,
	findInStore,
	getFromStore,
	setIntoStore,
	subscribeToTransaction,
} from "atom.io/internal"

import type { Json, JsonIO } from "atom.io/json"
import type { ServerConfig } from "../../realtime-server/src"
import { usersOfSockets } from "../../realtime-server/src"
import {
	completeUpdateAtoms,
	socketEpochSelectors,
	socketUnacknowledgedUpdatesSelectors,
} from "../../realtime-server/src/realtime-server-stores/server-sync-store"
import type { ContinuityToken } from "./realtime-continuity"
import { redactedPerspectiveUpdateSelectors } from "./realtime-continuity-store"

export type RealtimeSynchronizer = ReturnType<typeof realtimeSynchronizer>
export function realtimeSynchronizer({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function synchronizer(continuity: ContinuityToken): void {
		const userKeyState = findInStore(
			usersOfSockets.states.userKeyOfSocket,
			socket.id,
			store,
		)
		const userKey = getFromStore(userKeyState, store)
		if (!userKey) {
			store.logger.error(
				`❌`,
				continuity.type,
				continuity.key,
				`Tried to create a synchronizer for a socket that is not connected to a user.`,
			)
			return
		}

		const sendInitialPayload = () => {
			const initialPayload: Json.Serializable[] = []
			for (const atom of continuity.globals) {
				initialPayload.push(atom, getFromStore(atom, store))
			}
			for (const {
				perspectiveAtoms,
				resourceAtoms,
			} of continuity.perspectives) {
				const perspectiveState = findInStore(perspectiveAtoms, userKey, store)
				const perspectiveKeys = getFromStore(perspectiveState, store)
				for (const key of perspectiveKeys) {
					const resourceState = findInStore(resourceAtoms, key, store)
					initialPayload.push(key, getFromStore(resourceState, store))
				}
			}
		}
		socket.on(`get:${continuity.key}`, sendInitialPayload)

		for (const tx of continuity.actions) {
			const socketUnacknowledgedUpdatesState = findInStore(
				socketUnacknowledgedUpdatesSelectors,
				socket.id,
				store,
			)
			const socketUnacknowledgedUpdates = getFromStore(
				socketUnacknowledgedUpdatesState,
				store,
			)

			const fillTransactionRequest = (
				update: Pick<AtomIO.TransactionUpdate<JsonIO>, `id` | `params`>,
			) => {
				const performanceKey = `tx-run:${tx.key}:${update.id}`
				const performanceKeyStart = `${performanceKey}:start`
				const performanceKeyEnd = `${performanceKey}:end`
				performance.mark(performanceKeyStart)
				actUponStore(tx, update.id, store)(...update.params)
				performance.mark(performanceKeyEnd)
				const metric = performance.measure(
					performanceKey,
					performanceKeyStart,
					performanceKeyEnd,
				)
				store?.logger.info(
					`🚀`,
					`transaction`,
					tx.key,
					update.id,
					metric.duration,
				)
			}
			socket.off(`tx-run:${tx.key}`, fillTransactionRequest)
			socket.on(`tx-run:${tx.key}`, fillTransactionRequest)

			let unsubscribeFromTransaction: (() => void) | undefined
			const fillTransactionSubscriptionRequest = () => {
				unsubscribeFromTransaction = subscribeToTransaction(
					tx,
					(update) => {
						const updateState = findInStore(
							completeUpdateAtoms,
							update.id,
							store,
						)
						setIntoStore(updateState, update, store)
						const redactedUpdateKey = {
							socketId: socket.id,
							syncGroupKey: continuity.key,
							updateId: update.id,
						}
						const redactedUpdateState = findInStore(
							redactedPerspectiveUpdateSelectors,
							redactedUpdateKey,
							store,
						)
						const redactedUpdate = getFromStore(redactedUpdateState, store)

						setIntoStore(
							socketUnacknowledgedUpdatesState,
							(updates) => {
								if (redactedUpdate) {
									updates.push(redactedUpdate)
									updates.sort((a, b) => a.epoch - b.epoch)
								}
								return updates
							},
							store,
						)

						socket.emit(`tx-new:${tx.key}`, redactedUpdate as Json.Serializable)
					},
					`tx-sub:${tx.key}:${socket.id}`,
					store,
				)
				socket.on(`tx-unsub:${tx.key}`, unsubscribeFromTransaction)
			}
			socket.on(`tx-sub:${tx.key}`, fillTransactionSubscriptionRequest)

			let i = 1
			let next = 1
			const retry = setInterval(() => {
				const toEmit = socketUnacknowledgedUpdates[0]
				console.log(userKey, socketUnacknowledgedUpdates)
				if (toEmit && i === next) {
					socket.emit(`tx-new:${tx.key}`, toEmit as Json.Serializable)
					next *= 2
				}

				i++
			}, 250)

			const trackClientAcknowledgement = (epoch: number) => {
				i = 1
				next = 1
				const socketEpochState = findInStore(
					socketEpochSelectors,
					socket.id,
					store,
				)

				setIntoStore(socketEpochState, epoch, store)
				if (socketUnacknowledgedUpdates[0]?.epoch === epoch) {
					setIntoStore(
						socketUnacknowledgedUpdatesState,
						(updates) => {
							updates.shift()
							return updates
						},
						store,
					)
				}
			}
			socket.on(`tx-ack:${tx.key}`, trackClientAcknowledgement)
		}
	}
}
