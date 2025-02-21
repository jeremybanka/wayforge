import type { Store } from "atom.io/internal"
import {
	assignTransactionToContinuity,
	getFromStore,
	getJsonToken,
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

import { useRegisterAndAttemptConfirmedUpdate } from "./continuity/register-and-attempt-confirmed-update"
import { useConcealState } from "./continuity/use-conceal-state"
import { useRevealState } from "./continuity/use-reveal-state"

export function syncContinuity(
	continuity: ContinuityToken,
	socket: Socket,
	store: Store,
): () => void {
	const continuityKey = continuity.key
	const optimisticUpdates = getFromStore(store, optimisticUpdateQueue)
	const confirmedUpdates = getFromStore(store, confirmedUpdateQueue)

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
		setEpochNumberOfContinuity(continuityKey, epoch, store)
	}
	socket.off(`continuity-init:${continuityKey}`)
	socket.on(`continuity-init:${continuityKey}`, initializeContinuity)

	const registerAndAttemptConfirmedUpdate = useRegisterAndAttemptConfirmedUpdate(
		store,
		continuityKey,
		socket,
		optimisticUpdates,
		confirmedUpdates,
	)
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
					setIntoStore(store, optimisticUpdateQueue, (queue) => {
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
					setIntoStore(store, optimisticUpdateQueue, (queue) => {
						queue[optimisticUpdateIndex] = clientUpdate
						return queue
					})
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

	const revealState = useRevealState(store, continuityKey)
	const concealState = useConcealState(store)
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
