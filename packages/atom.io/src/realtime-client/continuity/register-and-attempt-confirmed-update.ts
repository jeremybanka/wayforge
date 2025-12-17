import type * as AtomIO from "atom.io"
import type { Fn, RootStore } from "atom.io/internal"
import {
	actUponStore,
	getEpochNumberOfContinuity,
	ingestTransactionOutcomeEvent,
	setEpochNumberOfContinuity,
	setIntoStore,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Socket } from "atom.io/realtime"

import {
	confirmedUpdateQueueAtom,
	optimisticUpdateQueueAtom,
} from "../realtime-client-stores"

export const useRegisterAndAttemptConfirmedUpdate =
	(
		store: RootStore,
		continuityKey: string,
		socket: Socket,
		optimisticUpdates: readonly AtomIO.TransactionOutcomeEvent<
			AtomIO.TransactionToken<Fn>
		>[],
		confirmedUpdates: readonly AtomIO.TransactionOutcomeEvent<
			AtomIO.TransactionToken<Fn>
		>[],
	) =>
	(
		confirmed: AtomIO.TransactionOutcomeEvent<AtomIO.TransactionToken<Fn>> &
			Json.Serializable,
	): void => {
		function reconcileEpoch(
			optimisticUpdate: AtomIO.TransactionOutcomeEvent<
				AtomIO.TransactionToken<Fn>
			>,
			confirmedUpdate: AtomIO.TransactionOutcomeEvent<
				AtomIO.TransactionToken<Fn>
			>,
		): void {
			store.logger.info(
				`🧑‍⚖️`,
				`continuity`,
				continuityKey,
				`reconciling updates`,
			)
			setIntoStore(store, optimisticUpdateQueueAtom, (queue) => {
				queue.shift()
				return queue
			})
			if (optimisticUpdate.id === confirmedUpdate.id) {
				const clientResult = JSON.stringify(optimisticUpdate.subEvents)
				const serverResult = JSON.stringify(confirmedUpdate.subEvents)
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
					`thought update #${confirmedUpdate.epoch} was ${optimisticUpdate.token.key}:${optimisticUpdate.id}, but it was actually ${confirmedUpdate.token.key}:${confirmedUpdate.id}`,
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
				ingestTransactionOutcomeEvent(store, subsequentOptimistic, `oldValue`)
			}
			store.logger.info(
				`⏪`,
				`continuity`,
				continuityKey,
				`undid optimistic updates:`,
				reversedOptimisticUpdates,
			)
			ingestTransactionOutcomeEvent(store, optimisticUpdate, `oldValue`)
			store.logger.info(
				`⏪`,
				`continuity`,
				continuityKey,
				`undid zeroth optimistic update`,
				optimisticUpdate,
			)
			ingestTransactionOutcomeEvent(store, confirmedUpdate, `newValue`)
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
					key: subsequentOptimistic.token.key,
				} as const
				const { id, params } = subsequentOptimistic
				actUponStore(store, token, id)(...params)
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
					setIntoStore(store, confirmedUpdateQueueAtom, (queue) => {
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
			let continuityEpoch: number | undefined
			continuityEpoch = getEpochNumberOfContinuity(store, continuityKey)

			if (continuityEpoch === confirmed.epoch - 1) {
				store.logger.info(
					`✅`,
					`continuity`,
					continuityKey,
					`integrating update #${confirmed.epoch} (${confirmed.token.key} ${confirmed.id})`,
				)
				ingestTransactionOutcomeEvent(store, confirmed, `newValue`)
				socket.emit(`ack:${continuityKey}`, confirmed.epoch)
				setEpochNumberOfContinuity(store, continuityKey, confirmed.epoch)
			} else if (continuityEpoch !== undefined) {
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
					setIntoStore(store, confirmedUpdateQueueAtom, (queue) => {
						queue.push(confirmed)
						queue.sort((a, b) => a.epoch - b.epoch)
						return queue
					})
				}
			}
		}
	}
