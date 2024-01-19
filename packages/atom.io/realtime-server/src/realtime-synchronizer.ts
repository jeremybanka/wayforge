import * as AtomIO from "atom.io"
import { IMPLICIT, findInStore, subscribeToTransaction } from "atom.io/internal"

import type { ServerConfig } from "."
import type { SyncGroupToken } from "../../__unstable__/create-realtime-sync-group"
import { socketsOfClients } from "./realtime-server-stores"
import {
	completeUpdateAtoms,
	redactedUpdateSelectors,
	socketEpochSelectors,
	socketUnacknowledgedUpdatesSelectors,
	transactionRedactorAtoms,
} from "./realtime-server-stores/server-sync-store"

export type RealtimeSynchronizer = ReturnType<typeof realtimeSynchronizer>
export function realtimeSynchronizer({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function synchronizer(syncGroup: SyncGroupToken): () => void {
		const clientIdState = findInStore(
			socketsOfClients.states.clientKeyOfSocket,
			socket.id,
			store,
		)
		const clientId = AtomIO.getState(clientIdState, store)
		if (!clientId) {
			throw new Error(
				`Tried to create a synchronizer for a socket that is not connected to a client.`,
			)
		}
		const clientPerspectiveTokens = syncGroup.perspectives.map((perspective) => {
			const { perspectiveAtoms } = perspective
			const perspectiveToken = findInStore(perspectiveAtoms, clientId, store)
			return perspectiveToken
		})

		const tx = syncGroup.actions[0]
		const filterTransactionUpdates = (
			visible: string[],
			transactionUpdate: AtomIO.TransactionUpdate<any>,
		) => {
			return transactionUpdate.updates
				.filter((update) => {
					if (`newValue` in update) {
						return visible.includes(update.key)
					}
					return true
				})
				.map((update) => {
					if (`updates` in update) {
						return {
							...update,
							updates: filterTransactionUpdates(visible, update),
						}
					}
				})
		}
		const filter: (
			updates: AtomIO.TransactionUpdate<any>,
		) => AtomIO.TransactionUpdate<any> = (update) => {
			const clientPerspectives = clientPerspectiveTokens.flatMap(
				(perspectiveToken) => {
					const perspective = AtomIO.getState(perspectiveToken, store)
					const visibleTokens = [...perspective]
					return visibleTokens
				},
			)
			const visibleKeys = syncGroup.globals.map((atomToken) => atomToken.key)
			visibleKeys.push(...clientPerspectives)
			return filterTransactionUpdates(visibleKeys, update)
		}

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
			store?.logger.info(`🚀`, `transaction`, tx.key, update.id, metric.duration)
		}
		socket.off(`tx-run:${tx.key}`, fillTransactionRequest)
		socket.on(`tx-run:${tx.key}`, fillTransactionRequest)

		let unsubscribeFromTransaction: (() => void) | undefined
		const fillTransactionSubscriptionRequest = () => {
			unsubscribeFromTransaction = subscribeToTransaction(
				tx,
				(update) => {
					const updateState = findInStore(completeUpdateAtoms, update.id, store)
					AtomIO.setState(updateState, update, store)
					const toEmit = filter(update)

					AtomIO.setState(
						socketUnacknowledgedUpdatesState,
						(updates) => {
							if (toEmit) {
								updates.push(toEmit)
								updates.sort((a, b) => a.epoch - b.epoch)
							}
							return updates
						},
						store,
					)

					socket.emit(`tx-new:${tx.key}`, toEmit)
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
			console.log(clientId, socketUnacknowledgedUpdates)
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

		return () => {
			if (unsubscribeFromTransaction) {
				unsubscribeFromTransaction()
				unsubscribeFromTransaction = undefined
			}
			clearInterval(retry)
			socket.off(`tx-run:${tx.key}`, fillTransactionRequest)
			socket.off(`tx-sub:${tx.key}`, fillTransactionSubscriptionRequest)
		}
	}
}
