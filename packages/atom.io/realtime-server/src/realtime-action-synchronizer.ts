import type * as AtomIO from "atom.io"
import {
	IMPLICIT,
	actUponStore,
	assignTransactionToContinuity,
	findInStore,
	getFromStore,
	setIntoStore,
	subscribeToTransaction,
} from "atom.io/internal"
import type { Json, JsonIO } from "atom.io/json"

import type { ServerConfig } from "."
import {
	completeUpdateAtoms,
	redactedUpdateSelectors,
	transactionRedactorAtoms,
	userUnacknowledgedQueues,
	usersOfSockets,
} from "./realtime-server-stores"

export type ActionSynchronizer = ReturnType<typeof realtimeActionSynchronizer>
export function realtimeActionSynchronizer({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function actionSynchronizer<ƒ extends JsonIO>(
		tx: AtomIO.TransactionToken<ƒ>,
		filter?: (
			update: AtomIO.TransactionUpdateContent[],
		) => AtomIO.TransactionUpdateContent[],
	): () => void {
		assignTransactionToContinuity(`default`, tx.key, store)

		const userKeyState = findInStore(
			usersOfSockets.states.userKeyOfSocket,
			socket.id,
			store,
		)
		const userKey = getFromStore(userKeyState, store)
		if (!userKey) {
			store.logger.error(
				`❌`,
				`transaction`,
				tx.key,
				`Tried to create a synchronizer for a socket (${socket.id}) that is not connected to a user.`,
			)
			return () => {}
		}
		const userUnacknowledgedQueue = findInStore(
			userUnacknowledgedQueues,
			userKey,
			store,
		)
		const userUnacknowledgedUpdates = getFromStore(
			userUnacknowledgedQueue,
			store,
		)
		if (filter) {
			const redactorState = findInStore(transactionRedactorAtoms, tx.key, store)
			setIntoStore(redactorState, { filter }, store)
		}

		const fillTransactionRequest = (
			update: Pick<AtomIO.TransactionUpdate<ƒ>, `id` | `params`>,
		) => {
			const performanceKey = `tx-run:${tx.key}:${update.id}`
			const performanceKeyStart = `${performanceKey}:start`
			const performanceKeyEnd = `${performanceKey}:end`
			performance.mark(performanceKeyStart)
			actUponStore<ƒ>(tx, update.id, store)(...update.params)
			performance.mark(performanceKeyEnd)
			const metric = performance.measure(
				performanceKey,
				performanceKeyStart,
				performanceKeyEnd,
			)
			store?.logger.info(`🚀`, `transaction`, tx.key, update.id, metric.duration)
		}
		socket.off(`tx-run:${tx.key}`, fillTransactionRequest)
		socket.on(`tx-run:${tx.key}`, fillTransactionRequest)

		let unsubscribeFromTransaction: (() => void) | undefined
		const fillTransactionSubscriptionRequest = () => {
			unsubscribeFromTransaction = subscribeToTransaction(
				tx,
				(update) => {
					const updateState = findInStore(completeUpdateAtoms, update.id, store)
					setIntoStore(updateState, update, store)
					const toEmit: Pick<
						AtomIO.TransactionUpdate<ƒ>,
						`epoch` | `id` | `key` | `output` | `updates`
					> | null = filter
						? getFromStore(
								findInStore(redactedUpdateSelectors, [tx.key, update.id], store),
								store,
						  )
						: update

					// the problem is that only while a socket is connected can
					// updates be set in the queue for that socket's client.
					//
					// we need a client session that can persist between disconnects
					setIntoStore(
						userUnacknowledgedQueue,
						(updates) => {
							if (toEmit) {
								updates.push(toEmit)
								updates.sort((a, b) => a.epoch - b.epoch)
							}
							return updates
						},
						store,
					)

					socket.emit(`tx-new:${tx.key}`, toEmit as Json.Serializable)
				},
				`tx-sub:${tx.key}:${socket.id}`,
				store,
			)
			socket.on(`tx-unsub:${tx.key}`, unsubscribeFromTransaction)
		}
		socket.on(`tx-sub:${tx.key}`, fillTransactionSubscriptionRequest)

		let i = 1
		let next = 1
		const retry = setInterval(() => {
			const toEmit = userUnacknowledgedUpdates[0]
			if (toEmit && i === next) {
				socket.emit(`tx-new:${tx.key}`, toEmit as Json.Serializable)
				next *= 2
			}

			i++
		}, 250)

		const trackClientAcknowledgement = (epoch: number) => {
			i = 1
			next = 1
			8
			if (userUnacknowledgedUpdates[0]?.epoch === epoch) {
				setIntoStore(
					userUnacknowledgedQueue,
					(updates) => {
						updates.shift()
						return updates
					},
					store,
				)
			}
		}
		socket.on(`tx-ack:${tx.key}`, trackClientAcknowledgement)

		return () => {
			if (unsubscribeFromTransaction) {
				unsubscribeFromTransaction()
				unsubscribeFromTransaction = undefined
			}
			clearInterval(retry)
			socket.off(`tx-run:${tx.key}`, fillTransactionRequest)
			socket.off(`tx-sub:${tx.key}`, fillTransactionSubscriptionRequest)
		}
	}
}
