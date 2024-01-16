import * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"
import type { Socket } from "socket.io-client"

import { isRootStore } from "../../internal/src/transaction/is-root-store"
import {
	optimisticUpdateQueueState,
	serverConfirmedUpdateQueueState,
} from "./realtime-client-stores"

export function syncAction<ƒ extends AtomIO.ƒn>(
	token: AtomIO.TransactionToken<ƒ>,
	socket: Socket,
	optimisticQueue: AtomIO.TransactionUpdate<any>[],
	confirmedQueue: AtomIO.TransactionUpdate<any>[],
	store: Internal.Store,
): () => void {
	const unsubscribeFromLocalUpdates = Internal.subscribeToTransaction(
		token,
		(clientUpdate) => {
			const optimisticUpdateQueueIndex = optimisticQueue.findIndex(
				(update) => update.id === clientUpdate.id,
			)
			if (optimisticUpdateQueueIndex === -1) {
				AtomIO.setState(optimisticUpdateQueueState, (queue) => {
					queue.push(clientUpdate)
					queue.sort((a, b) => a.epoch - b.epoch)
					return queue
				})
				socket.emit(`tx-run:${token.key}`, clientUpdate)
			} else {
				AtomIO.setState(optimisticUpdateQueueState, (queue) => {
					queue[optimisticUpdateQueueIndex] = clientUpdate
					return queue
				})
				socket.emit(`tx-run:${token.key}`, clientUpdate)
			}
		},
		`tx-run:${token.key}:${socket.id}`,
		store,
	)
	const reconcileUpdates = (
		optimisticUpdate: AtomIO.TransactionUpdate<ƒ>,
		confirmedUpdate: AtomIO.TransactionUpdate<ƒ>,
	) => {
		AtomIO.setState(optimisticUpdateQueueState, (queue) => {
			queue.shift()
			return queue
		})
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
				return
			}
			store.logger.warn(
				`❌`,
				`transaction`,
				token.key,
				`results do not match between client and server:`,
				{ clientResult, serverResult },
			)
		} else {
			// id mismatch
			store.logger.warn(
				`❌`,
				`transaction`,
				token.key,
				`we thought update #${confirmedUpdate.epoch} was ${optimisticUpdate.key}:${optimisticUpdate.id}, but it was actually ${confirmedUpdate.key}:${confirmedUpdate.id}`,
			)
		}
		for (const subsequentOptimistic of optimisticQueue.toReversed()) {
			Internal.ingestTransactionUpdate(`oldValue`, subsequentOptimistic, store)
		}
		Internal.ingestTransactionUpdate(`oldValue`, optimisticUpdate, store)
		Internal.ingestTransactionUpdate(`newValue`, confirmedUpdate, store)
		for (const subsequentOptimistic of optimisticQueue) {
			const token = Object.assign(
				{ type: `transaction` } as const,
				subsequentOptimistic,
			)
			const { id, params } = subsequentOptimistic
			AtomIO.runTransaction(token, id, store)(...params)
		}
	}

	const registerAndAttemptConfirmedUpdate = (
		confirmedUpdate: AtomIO.TransactionUpdate<ƒ>,
	) => {
		const optimisticUpdate = optimisticQueue[0]
		if (optimisticUpdate) {
			if (optimisticUpdate.epoch === confirmedUpdate.epoch) {
				reconcileUpdates(optimisticUpdate, confirmedUpdate)
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
				AtomIO.setState(serverConfirmedUpdateQueueState, (queue) => {
					queue.push(confirmedUpdate)
					queue.sort((a, b) => a.epoch - b.epoch)
					return queue
				})
			}
		} else {
			if (
				isRootStore(store) &&
				store.transactionMeta.epoch === confirmedUpdate.epoch - 1
			) {
				Internal.ingestTransactionUpdate(`newValue`, confirmedUpdate, store)
				store.transactionMeta.epoch = confirmedUpdate.epoch
			} else if (isRootStore(store)) {
				store.logger.warn(
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
