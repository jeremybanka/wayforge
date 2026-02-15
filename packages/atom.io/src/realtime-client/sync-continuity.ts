import type { RootStore } from "atom.io/internal"
import {
	assignTransactionToContinuity,
	getFromStore,
	getJsonToken,
	setEpochNumberOfContinuity,
	setIntoStore,
	subscribeToTransaction,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { ContinuityToken, Socket } from "atom.io/realtime"

import { useRegisterAndAttemptConfirmedUpdate as initRegisterAndAttemptConfirmedUpdate } from "./continuity/register-and-attempt-confirmed-update"
import { useConcealState as initConcealState } from "./continuity/use-conceal-state"
import { createRevealState as initRevealState } from "./continuity/use-reveal-state"
import {
	confirmedUpdateQueueAtom,
	optimisticUpdateQueueAtom,
} from "./realtime-client-stores"

export function syncContinuity(
	store: RootStore,
	socket: Socket,
	continuity: ContinuityToken,
): () => void {
	const continuityKey = continuity.key
	const optimisticUpdates = getFromStore(store, optimisticUpdateQueueAtom)
	const confirmedUpdates = getFromStore(store, confirmedUpdateQueueAtom)

	const initializeContinuity = (epoch: number, payload: Json.Array) => {
		socket.off(`continuity-init:${continuityKey}`, initializeContinuity)
		let i = 0
		let k: any
		let v: any
		for (const x of payload) {
			if (i % 2 === 0) {
				k = x
			} else {
				v = x
				if (`type` in k && k.type === `mutable_atom`) {
					k = getJsonToken(store, k)
				}
				setIntoStore(store, k, v)
			}
			i++
		}
		setEpochNumberOfContinuity(store, continuityKey, epoch)
	}
	socket.off(`continuity-init:${continuityKey}`)
	socket.on(`continuity-init:${continuityKey}`, initializeContinuity)

	const registerAndAttemptConfirmedUpdate =
		initRegisterAndAttemptConfirmedUpdate(
			store,
			continuityKey,
			socket,
			optimisticUpdates,
			confirmedUpdates,
		)
	socket.off(`tx-new:${continuityKey}`)
	socket.on(`tx-new:${continuityKey}`, registerAndAttemptConfirmedUpdate)

	const unsubscribeFunctions = continuity.actions.map((transaction) => {
		assignTransactionToContinuity(store, continuityKey, transaction.key)
		const unsubscribeFromTransactionUpdates = subscribeToTransaction(
			store,
			transaction,
			`tx-run:${continuityKey}`,
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
					setIntoStore(store, optimisticUpdateQueueAtom, (queue) => {
						queue.push(clientUpdate)
						queue.sort((a, b) => a.epoch - b.epoch)
						return queue
					})
				} else {
					store.logger.info(
						`🤞`,
						`continuity`,
						continuityKey,
						`replacing existing optimistic update at index ${optimisticUpdateIndex}`,
					)
					setIntoStore(store, optimisticUpdateQueueAtom, (queue) => {
						queue[optimisticUpdateIndex] = clientUpdate
						return queue
					})
				}
				socket.emit(`tx-run:${continuityKey}`, {
					id: clientUpdate.id,
					token: transaction,
					params: clientUpdate.params,
				})
			},
		)
		return unsubscribeFromTransactionUpdates
	})

	const revealState = initRevealState(store)
	const concealState = initConcealState(store)
	socket.on(`reveal:${continuityKey}`, revealState)
	socket.on(`conceal:${continuityKey}`, concealState)

	socket.emit(`get:${continuityKey}`)
	return () => {
		socket.off(`continuity-init:${continuityKey}`)
		socket.off(`tx-new:${continuityKey}`)
		for (const unsubscribe of unsubscribeFunctions) unsubscribe()
		// socket.emit(`unsub:${continuityKey}`)
	}
}
