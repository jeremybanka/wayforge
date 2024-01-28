import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import {
	actUponStore,
	assignTransactionToContinuity,
	getEpochNumberOfContinuity,
	getFromStore,
	ingestTransactionUpdate,
	isRootStore,
	setEpochNumberOfContinuity,
	setIntoStore,
	subscribeToTransaction,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { ContinuityToken } from "atom.io/realtime"
import {
	confirmedUpdateQueue,
	optimisticUpdateQueue,
} from "atom.io/realtime-client"
import type { Socket } from "socket.io-client"

function reconcileEpoch(
	continuityKey: string,
	optimisticUpdate: AtomIO.TransactionUpdate<any>,
	confirmedUpdate: AtomIO.TransactionUpdate<any>,
	subsequentOptimisticUpdates: AtomIO.TransactionUpdate<any>[],
	socket: Socket,
	store: Store,
): void {
	console.log(`>>>>> ${store.config.name} reconciling updates`)
	setIntoStore(
		optimisticUpdateQueue,
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
				`continuity`,
				continuityKey,
				`results for ${optimisticUpdate.id} match between client and server`,
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
			`${store.config.name} thought update #${confirmedUpdate.epoch} was ${optimisticUpdate.key}:${optimisticUpdate.id}, but it was actually ${confirmedUpdate.key}:${confirmedUpdate.id}`,
		)
	}
	for (const subsequentOptimistic of subsequentOptimisticUpdates.toReversed()) {
		ingestTransactionUpdate(`oldValue`, subsequentOptimistic, store)
	}
	console.log(
		`>>>>> ${store.config.name} undid optimistic updates`,
		subsequentOptimisticUpdates.toReversed(),
	)
	ingestTransactionUpdate(`oldValue`, optimisticUpdate, store)
	console.log(
		`>>>>> ${store.config.name} undid zeroth optimistic update`,
		optimisticUpdate,
	)
	ingestTransactionUpdate(`newValue`, confirmedUpdate, store)
	console.log(
		`>>>>> ${store.config.name} applied confirmed update`,
		confirmedUpdate,
	)

	console.log(
		`>>>>> ${store.config.name} reapplying subsequent optimistic updates:`,
		subsequentOptimisticUpdates,
	)

	socket.emit(`ack:${continuityKey}`, confirmedUpdate.epoch)
	for (const subsequentOptimistic of subsequentOptimisticUpdates) {
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
	console.log(`>>>>> ${store.config.name} integrating confirmed update`)
	console.log(`>>>>> ${store.config.name} optimisticUpdates`, optimisticUpdates)
	console.log(`>>>>> ${store.config.name} confirmedUpdate`, confirmedUpdate)
	const zerothOptimisticUpdate = optimisticUpdates[0]
	console.log(
		`>>>>> ${store.config.name} zerothOptimisticUpdate`,
		zerothOptimisticUpdate,
	)
	if (zerothOptimisticUpdate) {
		console.log(`>>>>> ${store.config.name} has optimistic updates to deal with`)
		if (zerothOptimisticUpdate.epoch === confirmedUpdate.epoch) {
			console.log(`>>>>> ${store.config.name} epochs match`)
			reconcileEpoch(
				continuityKey,
				zerothOptimisticUpdate,
				confirmedUpdate,
				optimisticUpdates,
				socket,
				store,
			)
			for (const nextConfirmed of confirmedUpdates) {
				const nextOptimistic = optimisticUpdates[0]
				if (nextConfirmed.epoch === nextOptimistic?.epoch) {
					reconcileEpoch(
						continuityKey,
						nextOptimistic,
						nextConfirmed,
						optimisticUpdates,
						socket,
						store,
					)
				} else {
					break
				}
			}
		} else {
			// epoch mismatch
			console.log(
				`>>>>> ${store.config.name} last applied update ${zerothOptimisticUpdate.epoch} does not match confirmed update ${confirmedUpdate.epoch}`,
			)
			const confirmedUpdateIsAlreadyEnqueued = confirmedUpdates.some(
				(update) => update.epoch === confirmedUpdate.epoch,
			)
			if (!confirmedUpdateIsAlreadyEnqueued) {
				console.log(
					`>>>>> ${store.config.name} pushing confirmed update to queue`,
					confirmedUpdates,
					`<-`,
					confirmedUpdate,
				)
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
		console.log(
			`>>>>> ${store.config.name} has no optimistic updates to deal with`,
		)
		const continuityEpoch = getEpochNumberOfContinuity(continuityKey, store)
		const isRoot = isRootStore(store)

		if (isRoot && continuityEpoch === confirmedUpdate.epoch - 1) {
			store.logger.info(
				`✅`,
				`continuity`,
				continuityKey,
				`integrating update #${confirmedUpdate.epoch} ${confirmedUpdate.key} ${confirmedUpdate.id}`,
			)
			ingestTransactionUpdate(`newValue`, confirmedUpdate, store)
			socket.emit(`ack:${continuityKey}`, confirmedUpdate.epoch)
			setEpochNumberOfContinuity(continuityKey, confirmedUpdate.epoch, store)
		} else if (isRoot) {
			store.logger.info(
				`❌`,
				`continuity`,
				continuityKey,
				`received out-of-order update from server`,
				{
					clientEpoch: continuityEpoch,
					serverEpoch: confirmedUpdate.epoch,
				},
			)
			const confirmedUpdateIsAlreadyEnqueued = confirmedUpdates.some(
				(update) => update.epoch === confirmedUpdate.epoch,
			)
			if (confirmedUpdateIsAlreadyEnqueued) {
				console.log(
					`>>>>> ${store.config.name} confirmed update is already enqueued`,
				)
			} else {
				console.log(
					`>>>>> pushing confirmed update to queue`,
					confirmedUpdate,
					`->`,
					confirmedUpdates,
				)
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

	const initializeContinuity = (epoch: number, payload: Json.Array) => {
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
		console.log(`>>>>> ${store.config.name} registering confirmed update`)
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
				console.log(`${store.config.name} enqueuing optimistic update`)
				const optimisticUpdateIndex = optimisticUpdates.findIndex(
					(update) => update.id === clientUpdate.id,
				)
				if (optimisticUpdateIndex === -1) {
					console.log(`${store.config.name} enqueuing new optimistic update`)
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
					console.log(
						`${store.config.name} replacing existing optimistic update`,
					)
					setIntoStore(
						optimisticUpdateQueue,
						(queue) => {
							queue[optimisticUpdateIndex] = clientUpdate
							return queue
						},
						store,
					)
				}
				console.log(``)
				socket.emit(`tx-run:${continuityKey}`, clientUpdate)
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
