import * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"
import type { Socket } from "socket.io-client"

import { isRootStore } from "../../internal/src/transaction/is-root-store"
import {
	confirmedUpdateQueueState,
	optimisticUpdateQueueState,
} from "./realtime-client-stores"

export function syncAction<ƒ extends AtomIO.ƒn>(
	token: AtomIO.TransactionToken<ƒ>,
	socket: Socket,
	store: Internal.Store,
): () => void {
	const optimisticQueue = Internal.getFromStore(
		optimisticUpdateQueueState,
		store,
	)
	const confirmedQueue = Internal.getFromStore(confirmedUpdateQueueState, store)

	const unsubscribeFromLocalUpdates = Internal.subscribeToTransaction(
		token,
		(clientUpdate) => {
			const optimisticUpdateQueueIndex = optimisticQueue.findIndex(
				(update) => update.id === clientUpdate.id,
			)
			if (optimisticUpdateQueueIndex === -1) {
				Internal.setIntoStore(
					optimisticUpdateQueueState,
					(queue) => {
						queue.push(clientUpdate)
						queue.sort((a, b) => a.epoch - b.epoch)
						return queue
					},
					store,
				)
				socket.emit(`tx-run:${token.key}`, clientUpdate)
			} else {
				Internal.setIntoStore(
					optimisticUpdateQueueState,
					(queue) => {
						queue[optimisticUpdateQueueIndex] = clientUpdate
						return queue
					},
					store,
				)
				socket.emit(`tx-run:${token.key}`, clientUpdate)
			}
		},
		`tx-run:${token.key}`,
		store,
	)
	const reconcileUpdates = (
		optimisticUpdate: AtomIO.TransactionUpdate<ƒ>,
		confirmedUpdate: AtomIO.TransactionUpdate<ƒ>,
	) => {
		Internal.setIntoStore(
			optimisticUpdateQueueState,
			(queue) => {
				queue.shift()
				return queue
			},
			store,
		)
		if (optimisticUpdate.id === confirmedUpdate.id) {
			const clientResult = JSON.stringify(optimisticUpdate.updates)
			const serverResult = JSON.stringify(confirmedUpdate.updates)
			if (clientResult === serverResult) {
				store.logger.info(
					`✅`,
					`transaction`,
					token.key,
					`results for ${optimisticUpdate.id} match between client and server`,
				)
				socket.emit(`tx-ack:${token.key}`, confirmedUpdate.epoch)
				return
			}
		} else {
			// id mismatch
			store.logger.info(
				`❌`,
				`transaction`,
				token.key,
				`${store.config.name} thought update #${confirmedUpdate.epoch} was ${optimisticUpdate.key}:${optimisticUpdate.id}, but it was actually ${confirmedUpdate.key}:${confirmedUpdate.id}`,
			)
		}
		for (const subsequentOptimistic of optimisticQueue.toReversed()) {
			Internal.ingestTransactionUpdate(`oldValue`, subsequentOptimistic, store)
		}
		Internal.ingestTransactionUpdate(`oldValue`, optimisticUpdate, store)
		Internal.ingestTransactionUpdate(`newValue`, confirmedUpdate, store)
		socket.emit(`tx-ack:${token.key}`, confirmedUpdate.epoch)
		for (const subsequentOptimistic of optimisticQueue) {
			const token = Object.assign(
				{ type: `transaction` } as const,
				subsequentOptimistic,
			)
			const { id, params } = subsequentOptimistic
			AtomIO.actUponStore(token, id, store)(...params)
		}
	}

	const registerAndAttemptConfirmedUpdate = (
		confirmedUpdate: AtomIO.TransactionUpdate<ƒ>,
	) => {
		const zerothOptimisticUpdate = optimisticQueue[0]
		if (zerothOptimisticUpdate) {
			if (zerothOptimisticUpdate.epoch === confirmedUpdate.epoch) {
				reconcileUpdates(zerothOptimisticUpdate, confirmedUpdate)
				for (const nextConfirmed of confirmedQueue) {
					const nextOptimistic = optimisticQueue[0]
					if (nextConfirmed.epoch === nextOptimistic.epoch) {
						reconcileUpdates(nextOptimistic, nextConfirmed)
					} else {
						break
					}
				}
			} else {
				// epoch mismatch

				const hasEnqueuedOptimisticUpdate = optimisticQueue.some(
					(update) => update.epoch === confirmedUpdate.epoch,
				)
				if (hasEnqueuedOptimisticUpdate) {
					Internal.setIntoStore(
						confirmedUpdateQueueState,
						(queue) => {
							queue.push(confirmedUpdate)
							queue.sort((a, b) => a.epoch - b.epoch)
							return queue
						},
						store,
					)
				}
			}
		} else {
			if (
				isRootStore(store) &&
				store.transactionMeta.epoch === confirmedUpdate.epoch - 1
			) {
				Internal.ingestTransactionUpdate(`newValue`, confirmedUpdate, store)
				socket.emit(`tx-ack:${token.key}`, confirmedUpdate.epoch)
				store.transactionMeta.epoch = confirmedUpdate.epoch
			} else if (isRootStore(store)) {
				store.logger.info(
					`❌`,
					`transaction`,
					token.key,
					`received out-of-order update from server`,
					{
						clientEpoch: store.transactionMeta.epoch,
						serverEpoch: confirmedUpdate.epoch,
					},
				)
			}
		}
	}
	socket.off(`tx-new:${token.key}`, registerAndAttemptConfirmedUpdate)
	socket.on(`tx-new:${token.key}`, registerAndAttemptConfirmedUpdate)
	socket.emit(`tx-sub:${token.key}`)
	const unsubscribeFromIncomingUpdates = () => {
		socket.off(`tx-new:${token.key}`, registerAndAttemptConfirmedUpdate)
		socket.emit(`tx-unsub:${token.key}`)
	}
	return () => {
		unsubscribeFromLocalUpdates()
		unsubscribeFromIncomingUpdates()
	}
}
