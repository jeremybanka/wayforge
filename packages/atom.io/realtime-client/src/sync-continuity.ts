import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import {
	actUponStore,
	assignTransactionToContinuity,
	deleteAtom,
	getEpochNumberOfContinuity,
	getFromStore,
	getJsonToken,
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

export function syncContinuity<F extends AtomIO.Func>(
	continuity: ContinuityToken,
	socket: Socket,
	store: Store,
): () => void {
	const continuityKey = continuity.key
	const optimisticUpdates = getFromStore(optimisticUpdateQueue, store)
	const confirmedUpdates = getFromStore(confirmedUpdateQueue, store)

	const initializeContinuity = (epoch: number, payload: Json.Array) => {
		socket.off(`continuity-init:${continuityKey}`, initializeContinuity)
		let i = 0
		let k: any = ``
		let v: any = null
		for (const x of payload) {
			if (i % 2 === 0) {
				k = x
			} else {
				v = x
				// console.log(`❗❗❗❗❗`, k, v)
				if (`type` in k && k.type === `mutable_atom`) {
					k = getJsonToken(k)
				}
				setIntoStore(k, v, store)
			}
			i++
		}
		setEpochNumberOfContinuity(continuityKey, epoch, store)
	}
	socket.off(`continuity-init:${continuityKey}`)
	socket.on(`continuity-init:${continuityKey}`, initializeContinuity)

	const registerAndAttemptConfirmedUpdate = (
		confirmed: AtomIO.TransactionUpdate<F>,
	) => {
		function reconcileEpoch(
			optimisticUpdate: AtomIO.TransactionUpdate<any>,
			confirmedUpdate: AtomIO.TransactionUpdate<any>,
		): void {
			store.logger.info(
				`🧑‍⚖️`,
				`continuity`,
				continuityKey,
				`reconciling updates`,
			)
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
					`thought update #${confirmedUpdate.epoch} was ${optimisticUpdate.key}:${optimisticUpdate.id}, but it was actually ${confirmedUpdate.key}:${confirmedUpdate.id}`,
				)
			}
			store.logger.info(
				`🧑‍⚖️`,
				`continuity`,
				continuityKey,
				`updates do not match`,
				optimisticUpdate,
				confirmedUpdate,
			)
			const reversedOptimisticUpdates = optimisticUpdates.toReversed()
			for (const subsequentOptimistic of reversedOptimisticUpdates) {
				ingestTransactionUpdate(`oldValue`, subsequentOptimistic, store)
			}
			store.logger.info(
				`⏪`,
				`continuity`,
				continuityKey,
				`undid optimistic updates:`,
				reversedOptimisticUpdates,
			)
			ingestTransactionUpdate(`oldValue`, optimisticUpdate, store)
			store.logger.info(
				`⏪`,
				`continuity`,
				continuityKey,
				`undid zeroth optimistic update`,
				optimisticUpdate,
			)
			ingestTransactionUpdate(`newValue`, confirmedUpdate, store)
			store.logger.info(
				`⏩`,
				`continuity`,
				continuityKey,
				`applied confirmed update`,
				confirmedUpdate,
			)
			socket.emit(`ack:${continuityKey}`, confirmedUpdate.epoch)

			for (const subsequentOptimistic of optimisticUpdates) {
				const token = {
					type: `transaction`,
					key: subsequentOptimistic.key,
				} as const
				const { id, params } = subsequentOptimistic
				actUponStore(token, id, store)(...params)
			}
			store.logger.info(
				`⏩`,
				`continuity`,
				continuityKey,
				`reapplied subsequent optimistic updates:`,
				optimisticUpdates,
			)
		}

		store.logger.info(
			`🧑‍⚖️`,
			`continuity`,
			continuityKey,
			`integrating confirmed update`,
			{ confirmedUpdate: confirmed, confirmedUpdates, optimisticUpdates },
		)
		const zerothOptimisticUpdate = optimisticUpdates[0]
		if (zerothOptimisticUpdate) {
			store.logger.info(
				`🧑‍⚖️`,
				`continuity`,
				continuityKey,
				`has optimistic updates to reconcile`,
			)
			if (confirmed.epoch === zerothOptimisticUpdate.epoch) {
				store.logger.info(
					`🧑‍⚖️`,
					`continuity`,
					continuityKey,
					`epoch of confirmed update #${confirmed.epoch} matches zeroth optimistic update`,
				)
				reconcileEpoch(zerothOptimisticUpdate, confirmed)
				for (const nextConfirmed of confirmedUpdates) {
					const nextOptimistic = optimisticUpdates[0]
					if (nextConfirmed.epoch === nextOptimistic?.epoch) {
						reconcileEpoch(nextOptimistic, nextConfirmed)
					} else {
						break
					}
				}
			} else {
				// epoch mismatch
				store.logger.info(
					`🧑‍⚖️`,
					`continuity`,
					continuityKey,
					`epoch of confirmed update #${confirmed.epoch} does not match zeroth optimistic update #${zerothOptimisticUpdate.epoch}`,
				)
				const confirmedUpdateIsAlreadyEnqueued = confirmedUpdates.some(
					(update) => update.epoch === confirmed.epoch,
				)
				if (!confirmedUpdateIsAlreadyEnqueued) {
					store.logger.info(
						`👈`,
						`continuity`,
						continuityKey,
						`pushing confirmed update to queue`,
						confirmed,
					)
					setIntoStore(
						confirmedUpdateQueue,
						(queue) => {
							queue.push(confirmed)
							queue.sort((a, b) => a.epoch - b.epoch)
							return queue
						},
						store,
					)
				}
			}
		} else {
			store.logger.info(
				`🧑‍⚖️`,
				`continuity`,
				continuityKey,
				`has no optimistic updates to deal with`,
			)
			const continuityEpoch = getEpochNumberOfContinuity(continuityKey, store)
			const isRoot = isRootStore(store)

			if (isRoot && continuityEpoch === confirmed.epoch - 1) {
				store.logger.info(
					`✅`,
					`continuity`,
					continuityKey,
					`integrating update #${confirmed.epoch} (${confirmed.key} ${confirmed.id})`,
				)
				ingestTransactionUpdate(`newValue`, confirmed, store)
				socket.emit(`ack:${continuityKey}`, confirmed.epoch)
				setEpochNumberOfContinuity(continuityKey, confirmed.epoch, store)
			} else if (isRoot && continuityEpoch !== undefined) {
				store.logger.info(
					`🧑‍⚖️`,
					`continuity`,
					continuityKey,
					`received update #${confirmed.epoch} but still waiting for update #${
						continuityEpoch + 1
					}`,
					{
						clientEpoch: continuityEpoch,
						serverEpoch: confirmed.epoch,
					},
				)
				const confirmedUpdateIsAlreadyEnqueued = confirmedUpdates.some(
					(update) => update.epoch === confirmed.epoch,
				)
				if (confirmedUpdateIsAlreadyEnqueued) {
					store.logger.info(
						`👍`,
						`continuity`,
						continuityKey,
						`confirmed update #${confirmed.epoch} is already enqueued`,
					)
				} else {
					store.logger.info(
						`👈`,
						`continuity`,
						continuityKey,
						`pushing confirmed update #${confirmed.epoch} to queue`,
					)
					setIntoStore(
						confirmedUpdateQueue,
						(queue) => {
							queue.push(confirmed)
							queue.sort((a, b) => a.epoch - b.epoch)
							return queue
						},
						store,
					)
				}
			}
		}
	}
	socket.off(`tx-new:${continuityKey}`)
	socket.on(`tx-new:${continuityKey}`, registerAndAttemptConfirmedUpdate)

	const unsubscribeFunctions = continuity.actions.map((transaction) => {
		assignTransactionToContinuity(continuityKey, transaction.key, store)
		const unsubscribeFromTransactionUpdates = subscribeToTransaction(
			transaction,
			(clientUpdate) => {
				store.logger.info(
					`🤞`,
					`continuity`,
					continuityKey,
					`enqueuing optimistic update`,
				)
				const optimisticUpdateIndex = optimisticUpdates.findIndex(
					(update) => update.id === clientUpdate.id,
				)
				if (optimisticUpdateIndex === -1) {
					store.logger.info(
						`🤞`,
						`continuity`,
						continuityKey,
						`enqueuing new optimistic update`,
					)
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
					store.logger.info(
						`🤞`,
						`continuity`,
						continuityKey,
						`replacing existing optimistic update at index ${optimisticUpdateIndex}`,
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
				socket.emit(`tx-run:${continuityKey}`, {
					id: clientUpdate.id,
					key: transaction.key,
					params: clientUpdate.params,
				})
			},
			`tx-run:${continuityKey}`,
			store,
		)
		return unsubscribeFromTransactionUpdates
	})

	socket.on(`reveal:${continuityKey}`, (revealed: Json.Array) => {
		let i = 0
		let k: any = ``
		let v: any = null
		for (const x of revealed) {
			if (i % 2 === 0) {
				k = x
			} else {
				v = x
				setIntoStore(k, v, store)
			}
			i++
		}
	})
	socket.on(
		`conceal:${continuityKey}`,
		(concealed: AtomIO.AtomToken<unknown>[]) => {
			for (const token of concealed) {
				deleteAtom(token, store)
			}
		},
	)

	socket.emit(`get:${continuityKey}`)
	return () => {
		socket.off(`continuity-init:${continuityKey}`)
		socket.off(`tx-new:${continuityKey}`)
		for (const unsubscribe of unsubscribeFunctions) unsubscribe()
		// socket.emit(`unsub:${continuityKey}`)
	}
}
