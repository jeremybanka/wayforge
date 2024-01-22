import type * as AtomIO from "atom.io"
import {
	IMPLICIT,
	actUponStore,
	findInStore,
	getFromStore,
	setIntoStore,
	subscribeToTransaction,
} from "atom.io/internal"

import type { ServerConfig } from "."
import { usersOfSockets } from "./realtime-server-stores"
import {
	completeUpdateAtoms,
	redactedUpdateSelectors,
	socketEpochSelectors,
	socketUnacknowledgedUpdatesSelectors,
	transactionRedactorAtoms,
} from "./realtime-server-stores/server-sync-store"

export type ActionSynchronizer = ReturnType<typeof realtimeActionSynchronizer>
export function realtimeActionSynchronizer({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function actionSynchronizer<ƒ extends AtomIO.ƒn>(
		tx: AtomIO.TransactionToken<ƒ>,
		filter?: (
			update: AtomIO.TransactionUpdateContent[],
		) => AtomIO.TransactionUpdateContent[],
	): () => void {
		const userKeyState = findInStore(
			usersOfSockets.states.userKeyOfSocket,
			socket.id,
			store,
		)
		const userKey = getFromStore(userKeyState, store)
		const socketUnacknowledgedUpdatesState = findInStore(
			socketUnacknowledgedUpdatesSelectors,
			socket.id,
			store,
		)
		const socketUnacknowledgedUpdates = getFromStore(
			socketUnacknowledgedUpdatesState,
			store,
		)
		if (filter) {
			const redactorState = findInStore(transactionRedactorAtoms, tx.key, store)
			setIntoStore(redactorState, { filter }, store)
		}
		const fillTransactionRequest = (update: AtomIO.TransactionUpdate<ƒ>) => {
			const performanceKey = `tx-run:${tx.key}:${update.id}`
			const performanceKeyStart = `${performanceKey}:start`
			const performanceKeyEnd = `${performanceKey}:end`
			performance.mark(performanceKeyStart)
			actUponStore<ƒ>(tx, update.id, store)(...update.params)
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
					setIntoStore(updateState, update, store)
					const toEmit = filter
						? getFromStore(
								findInStore(redactedUpdateSelectors, [tx.key, update.id], store),
								store,
						  )
						: update

					// the problem is that only while a socket is connected can
					// updates be set in the queue for that socket's client.
					//
					// we need a client session that can persist between disconnects
					setIntoStore(
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
