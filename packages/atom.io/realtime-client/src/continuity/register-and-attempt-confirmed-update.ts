import type * as AtomIO from "atom.io"
import type { Func, Store } from "atom.io/internal"
import {
	actUponStore,
	getEpochNumberOfContinuity,
	ingestTransactionUpdate,
	isRootStore,
	setEpochNumberOfContinuity,
	setIntoStore,
} from "atom.io/internal"
import {
	confirmedUpdateQueue,
	optimisticUpdateQueue,
} from "atom.io/realtime-client"
import type { Socket } from "atom.io/realtime-server"

export const useRegisterAndAttemptConfirmedUpdate =
	(
		store: Store,
		continuityKey: string,
		socket: Socket,
		optimisticUpdates: AtomIO.TransactionUpdate<any>[],
		confirmedUpdates: AtomIO.TransactionUpdate<any>[],
	) =>
	(confirmed: AtomIO.TransactionUpdate<Func>): void => {
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
			setIntoStore(store, optimisticUpdateQueue, (queue) => {
				queue.shift()
				return queue
			})
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
					setIntoStore(store, confirmedUpdateQueue, (queue) => {
						queue.push(confirmed)
						queue.sort((a, b) => a.epoch - b.epoch)
						return queue
					})
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
					setIntoStore(store, confirmedUpdateQueue, (queue) => {
						queue.push(confirmed)
						queue.sort((a, b) => a.epoch - b.epoch)
						return queue
					})
				}
			}
		}
	}
