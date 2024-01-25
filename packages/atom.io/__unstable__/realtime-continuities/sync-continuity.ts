import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import {
	actUponStore,
	getEpochNumberOfAction,
	getEpochNumberOfContinuity,
	getFromStore,
	ingestTransactionUpdate,
	setEpochNumberOfAction,
	setEpochNumberOfContinuity,
	setIntoStore,
	subscribeToTransaction,
} from "atom.io/internal"
import {
	confirmedUpdateQueue,
	optimisticUpdateQueue,
} from "atom.io/realtime-client"
import type { Socket } from "socket.io-client"

import { assignTransactionToContinuity } from "../../internal/src/transaction/assign-transaction-to-continuity"
import { isRootStore } from "../../internal/src/transaction/is-root-store"
import type { ContinuityToken } from "./realtime-continuity"

// RECONCILE_UPDATES
function reconcileUpdates(
	continuityKey: string,
	zerothOptimisticUpdate: AtomIO.TransactionUpdate<any>,
	optimisticUpdates: AtomIO.TransactionUpdate<any>[],
	confirmedUpdate: AtomIO.TransactionUpdate<any>,
	socket: Socket,
	store: Store,
): void {
	setIntoStore(
		optimisticUpdateQueue,
		(queue) => {
			queue.shift()
			return queue
		},
		store,
	)
	if (zerothOptimisticUpdate.id === confirmedUpdate.id) {
		const clientResult = JSON.stringify(zerothOptimisticUpdate.updates)
		const serverResult = JSON.stringify(confirmedUpdate.updates)
		if (clientResult === serverResult) {
			store.logger.info(
				`✅`,
				`continuity`,
				continuityKey,
				`results for ${zerothOptimisticUpdate.id} match between client and server`,
			)
			socket.emit(`ack:${continuityKey}`, confirmedUpdate.epoch)
			return
		}
	} else {
		// id mismatch
		store.logger.info(
			`❌`,
			`continuity`,
			continuityKey,
			`${store.config.name} thought update #${confirmedUpdate.epoch} was ${zerothOptimisticUpdate.key}:${zerothOptimisticUpdate.id}, but it was actually ${confirmedUpdate.key}:${confirmedUpdate.id}`,
		)
	}
	for (const subsequentOptimistic of optimisticUpdates.toReversed()) {
		ingestTransactionUpdate(`oldValue`, subsequentOptimistic, store)
	}
	ingestTransactionUpdate(`oldValue`, zerothOptimisticUpdate, store)
	ingestTransactionUpdate(`newValue`, confirmedUpdate, store)
	socket.emit(`ack:${continuityKey}`, confirmedUpdate.epoch)
	for (const subsequentOptimistic of optimisticUpdates) {
		const token = Object.assign(
			{ type: `transaction` } as const,
			subsequentOptimistic,
		)
		const { id, params } = subsequentOptimistic
		actUponStore(token, id, store)(...params)
	}
}

function integrateConfirmedUpdate(
	continuityKey: string,
	optimisticUpdates: AtomIO.TransactionUpdate<any>[],
	confirmedUpdate: AtomIO.TransactionUpdate<any>,
	confirmedUpdates: AtomIO.TransactionUpdate<any>[],
	socket: Socket,
	store: Store,
) {
	const zerothOptimisticUpdate = optimisticUpdates[0]
	if (zerothOptimisticUpdate) {
		if (zerothOptimisticUpdate.epoch === confirmedUpdate.epoch) {
			reconcileUpdates(
				continuityKey,
				zerothOptimisticUpdate,
				optimisticUpdates,
				confirmedUpdate,
				socket,
				store,
			)
			for (const nextConfirmed of confirmedUpdates) {
				const nextOptimistic = optimisticUpdates[0]
				if (nextConfirmed.epoch === nextOptimistic.epoch) {
					reconcileUpdates(
						continuityKey,
						nextOptimistic,
						optimisticUpdates,
						nextConfirmed,
						socket,
						store,
					)
				} else {
					break
				}
			}
		} else {
			// epoch mismatch

			const hasEnqueuedOptimisticUpdate = optimisticUpdates.some(
				(update) => update.epoch === confirmedUpdate.epoch,
			)
			if (hasEnqueuedOptimisticUpdate) {
				setIntoStore(
					confirmedUpdateQueue,
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
		const continuityEpoch = getEpochNumberOfContinuity(continuityKey, store)
		if (isRootStore(store) && continuityEpoch === confirmedUpdate.epoch - 1) {
			ingestTransactionUpdate(`newValue`, confirmedUpdate, store)
			socket.emit(`ack:${continuityKey}`, confirmedUpdate.epoch)
			setEpochNumberOfContinuity(continuityKey, confirmedUpdate.epoch, store)
		} else if (isRootStore(store)) {
			store.logger.info(
				`❌`,
				`continuity`,
				continuityKey,
				`received out-of-order update from server`,
				{
					clientEpoch: store.transactionMeta.epoch,
					serverEpoch: confirmedUpdate.epoch,
				},
			)
		}
	}
}

export function syncContinuity<ƒ extends AtomIO.ƒn>(
	continuity: ContinuityToken,
	socket: Socket,
	store: Store,
): () => void {
	const continuityKey = continuity.key
	const optimisticUpdates = getFromStore(optimisticUpdateQueue, store)
	const confirmedUpdates = getFromStore(confirmedUpdateQueue, store)

	const initializeContinuity = (epoch, payload) => {
		let i = 0
		let k: any = ``
		let v: any = null
		for (const x of payload) {
			if (i % 2 === 0) {
				k = x
			} else {
				v = x
				setIntoStore(k, v, store)
			}
			i++
		}
		setEpochNumberOfContinuity(continuityKey, epoch, store)
	}
	socket.off(`continuity-init:${continuityKey}`)
	socket.on(`continuity-init:${continuityKey}`, initializeContinuity)

	const registerAndAttemptConfirmedUpdate = (
		confirmedUpdate: AtomIO.TransactionUpdate<ƒ>,
	) => {
		integrateConfirmedUpdate(
			continuityKey,
			optimisticUpdates,
			confirmedUpdate,
			confirmedUpdates,
			socket,
			store,
		)
	}
	socket.off(`tx-new:${continuityKey}`)
	socket.on(`tx-new:${continuityKey}`, registerAndAttemptConfirmedUpdate)

	const unsubscribeFunctions = continuity.actions.map((transaction) => {
		assignTransactionToContinuity(continuityKey, transaction.key, store)
		const unsubscribeFromTransactionUpdates = subscribeToTransaction(
			transaction,
			(clientUpdate) => {
				const optimisticUpdateQueueIndex = optimisticUpdates.findIndex(
					(update) => update.id === clientUpdate.id,
				)
				if (optimisticUpdateQueueIndex === -1) {
					setIntoStore(
						optimisticUpdateQueue,
						(queue) => {
							queue.push(clientUpdate)
							queue.sort((a, b) => a.epoch - b.epoch)
							return queue
						},
						store,
					)
				} else {
					setIntoStore(
						optimisticUpdateQueue,
						(queue) => {
							queue[optimisticUpdateQueueIndex] = clientUpdate
							return queue
						},
						store,
					)
				}
				socket.emit(`tx-run:${transaction.key}`, clientUpdate)
			},
			`tx-run:${continuityKey}`,
			store,
		)
		return unsubscribeFromTransactionUpdates
	})

	socket.emit(`get:${continuityKey}`)
	return () => {
		socket.off(`continuity-init:${continuityKey}`)
		socket.off(`tx-new:${continuityKey}`)
		for (const unsubscribe of unsubscribeFunctions) unsubscribe()
		socket.emit(`unsub:${continuityKey}`)
	}
}
