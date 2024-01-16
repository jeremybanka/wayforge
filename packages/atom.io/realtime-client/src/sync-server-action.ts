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
	const optimisticQueue = AtomIO.getState(optimisticUpdateQueueState, store)
	const confirmedQueue = AtomIO.getState(confirmedUpdateQueueState, store)

	const unsubscribeFromLocalUpdates = Internal.subscribeToTransaction(
		token,
		(clientUpdate) => {
			console.log(
				`❓❓❓ sending update in store ${store.config.name} for token ${token.key}`,
			)
			const optimisticUpdateQueueIndex = optimisticQueue.findIndex(
				(update) => update.id === clientUpdate.id,
			)
			if (optimisticUpdateQueueIndex === -1) {
				AtomIO.setState(
					optimisticUpdateQueueState,
					(queue) => {
						console.log(`❓ queue`, queue)
						queue.push(clientUpdate)
						queue.sort((a, b) => a.epoch - b.epoch)
						return queue
					},
					store,
				)
				socket.emit(`tx-run:${token.key}`, clientUpdate)
			} else {
				AtomIO.setState(
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
		console.log(`❗ reconciling updates in store ${store.config.name}`)
		AtomIO.setState(
			optimisticUpdateQueueState,
			(queue) => {
				queue.shift()
				return queue
			},
			store,
		)
		if (optimisticUpdate.id === confirmedUpdate.id) {
			console.log(`❗ id match`)
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
			console.log(`❗ id mismatch`)
			store.logger.warn(
				`❌`,
				`transaction`,
				token.key,
				`we thought update #${confirmedUpdate.epoch} was ${optimisticUpdate.key}:${optimisticUpdate.id}, but it was actually ${confirmedUpdate.key}:${confirmedUpdate.id}`,
			)
		}
		for (const subsequentOptimistic of optimisticQueue.toReversed()) {
			console.log(`❗ undoing optimistic update ${subsequentOptimistic.id}`)
			Internal.ingestTransactionUpdate(`oldValue`, subsequentOptimistic, store)
		}
		console.log(`❗ reversing optimistic update ${optimisticUpdate.id}`)
		Internal.ingestTransactionUpdate(`oldValue`, optimisticUpdate, store)
		console.log(`❗ ingesting confirmed update ${confirmedUpdate.id}`)
		Internal.ingestTransactionUpdate(`newValue`, confirmedUpdate, store)
		for (const subsequentOptimistic of optimisticQueue) {
			console.log(`❗ retrying optimistic update ${subsequentOptimistic.id}`)
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
		console.log(optimisticQueue)
		console.log(`❗❗❗ received update in store ${store.config.name}`)
		const zerothOptimisticUpdate = optimisticQueue[0]
		if (zerothOptimisticUpdate) {
			console.log(`❗ optimistic update exists`)
			if (zerothOptimisticUpdate.epoch === confirmedUpdate.epoch) {
				console.log(`❗ epoch match`)
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
				console.log(
					`❗ epoch mismatch: ${zerothOptimisticUpdate.epoch} !== ${confirmedUpdate.epoch}`,
				)
				console.log(zerothOptimisticUpdate, confirmedUpdate)
				console.log(store.valueMap)
				console.log(store.transactionMeta)
				AtomIO.setState(
					confirmedUpdateQueueState,
					(queue) => {
						queue.push(confirmedUpdate)
						queue.sort((a, b) => a.epoch - b.epoch)
						return queue
					},
					store,
				)
			}
		} else {
			console.log(`❗ no optimistic update exists`)
			if (
				isRootStore(store) &&
				store.transactionMeta.epoch === confirmedUpdate.epoch - 1
			) {
				console.log(`❗ epoch match; ingesting update`)
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
	socket.off(`tx-new:${token.key}`, registerAndAttemptConfirmedUpdate)
	socket.on(`tx-new:${token.key}`, registerAndAttemptConfirmedUpdate)
	socket.emit(`tx-sub:${token.key}`)
	const unsubscribeFromIncomingUpdates = () => {
		socket.off(`tx-new:${token.key}`, registerAndAttemptConfirmedUpdate)
		socket.emit(`tx-unsub:${token.key}`)
	}
	return () => {
		console.log(`${store.config.name} unsubscribing from syncAction`)
		unsubscribeFromLocalUpdates()
		unsubscribeFromIncomingUpdates()
	}
}
