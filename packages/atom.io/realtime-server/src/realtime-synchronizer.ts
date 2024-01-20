import * as AtomIO from "atom.io"
import { IMPLICIT, findInStore, subscribeToTransaction } from "atom.io/internal"

import type { ServerConfig } from "."
import type { SyncGroupToken } from "../../__unstable__/create-realtime-sync-group"
import { usersOfSockets } from "./realtime-server-stores"
import {
	completeUpdateAtoms,
	redactedPerspectiveUpdateSelectors,
	socketEpochSelectors,
	socketUnacknowledgedUpdatesSelectors,
} from "./realtime-server-stores/server-sync-store"

export type RealtimeSynchronizer = ReturnType<typeof realtimeSynchronizer>
export function realtimeSynchronizer({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function synchronizer(syncGroup: SyncGroupToken): void {
		const userKeyState = findInStore(
			usersOfSockets.states.userKeyOfSocket,
			socket.id,
			store,
		)
		const userKey = AtomIO.getState(userKeyState, store)
		if (!userKey) {
			store.logger.error(
				`❌`,
				syncGroup.type,
				syncGroup.key,
				`Tried to create a synchronizer for a socket that is not connected to a user.`,
			)
			return
		}

		for (const tx of syncGroup.actions) {
			const socketUnacknowledgedUpdatesState = findInStore(
				socketUnacknowledgedUpdatesSelectors,
				socket.id,
				store,
			)
			const socketUnacknowledgedUpdates = AtomIO.getState(
				socketUnacknowledgedUpdatesState,
				store,
			)

			const fillTransactionRequest = (update: AtomIO.TransactionUpdate<any>) => {
				const performanceKey = `tx-run:${tx.key}:${update.id}`
				const performanceKeyStart = `${performanceKey}:start`
				const performanceKeyEnd = `${performanceKey}:end`
				performance.mark(performanceKeyStart)
				AtomIO.runTransaction(tx, update.id, store)(...update.params)
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
						AtomIO.setState(updateState, update, store)
						const redactedUpdateKey = {
							socketId: socket.id,
							syncGroupKey: syncGroup.key,
							updateId: update.id,
						}
						const redactedUpdateState = findInStore(
							redactedPerspectiveUpdateSelectors,
							redactedUpdateKey,
							store,
						)
						const redactedUpdate = AtomIO.getState(redactedUpdateState, store)

						AtomIO.setState(
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

						socket.emit(`tx-new:${tx.key}`, redactedUpdate)
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
					socket.emit(`tx-new:${tx.key}`, toEmit)
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

				AtomIO.setState(socketEpochState, epoch, store)
				if (socketUnacknowledgedUpdates[0]?.epoch === epoch) {
					AtomIO.setState(
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
