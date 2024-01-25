import type * as AtomIO from "atom.io"
import {
	IMPLICIT,
	actUponStore,
	findInStore,
	getFromStore,
	setIntoStore,
	subscribeToTransaction,
} from "atom.io/internal"

import type { Json, JsonIO } from "atom.io/json"
import { isRootStore } from "../../internal/src/transaction/is-root-store"
import type { ServerConfig } from "../../realtime-server/src"
import { usersOfSockets } from "../../realtime-server/src"
import {
	completeUpdateAtoms,
	socketEpochSelectors,
	socketUnacknowledgedQueues,
} from "../../realtime-server/src/realtime-server-stores/server-sync-store"
import type { ContinuityToken } from "./realtime-continuity"
import { redactedPerspectiveUpdateSelectors } from "./realtime-continuity-store"

export type RealtimeContinuitySynchronizer = ReturnType<
	typeof realtimeContinuitySynchronizer
>
export function realtimeContinuitySynchronizer({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function synchronizer(continuity: ContinuityToken): () => void {
		const continuityKey = continuity.key
		const userKeyState = findInStore(
			usersOfSockets.states.userKeyOfSocket,
			socket.id,
			store,
		)
		const userKey = getFromStore(userKeyState, store)
		if (!userKey) {
			store.logger.error(
				`❌`,
				continuity.type,
				continuityKey,
				`Tried to create a synchronizer for a socket that is not connected to a user.`,
			)
			return () => {}
		}

		const socketUnacknowledgedQueue = findInStore(
			socketUnacknowledgedQueues,
			socket.id,
			store,
		)
		const socketUnacknowledgedUpdates = getFromStore(
			socketUnacknowledgedQueue,
			store,
		)
		const unsubscribeFunctions: (() => void)[] = []

		const sendInitialPayload = () => {
			const initialPayload: Json.Serializable[] = []
			for (const atom of continuity.globals) {
				initialPayload.push(atom.key, getFromStore(atom, store))
			}
			for (const {
				perspectiveAtoms,
				resourceAtoms,
			} of continuity.perspectives) {
				const perspectiveState = findInStore(perspectiveAtoms, userKey, store)
				const perspectiveKeys = getFromStore(perspectiveState, store)
				for (const key of perspectiveKeys) {
					const resourceState = findInStore(resourceAtoms, key, store)
					initialPayload.push(key, getFromStore(resourceState, store))
				}
			}
			const epoch = isRootStore(store)
				? store.transactionMeta.epoch.get(continuityKey) ?? null
				: null
			socket.emit(`continuity-init:${continuityKey}`, epoch, initialPayload)

			for (const transaction of continuity.actions) {
				const unsubscribeFromTransaction = subscribeToTransaction(
					transaction,
					(update) => {
						const updateState = findInStore(
							completeUpdateAtoms,
							update.id,
							store,
						)
						setIntoStore(updateState, update, store)
						const redactedUpdateKey = {
							socketId: socket.id,
							syncGroupKey: continuityKey,
							updateId: update.id,
						}
						const redactedUpdateState = findInStore(
							redactedPerspectiveUpdateSelectors,
							redactedUpdateKey,
							store,
						)
						const redactedUpdate = getFromStore(redactedUpdateState, store)

						setIntoStore(
							socketUnacknowledgedQueue,
							(updates) => {
								if (redactedUpdate) {
									updates.push(redactedUpdate)
									updates.sort((a, b) => a.epoch - b.epoch)
								}
								return updates
							},
							store,
						)

						socket.emit(
							`tx-new:${continuityKey}`,
							redactedUpdate as Json.Serializable,
						)
					},
					`tx-sub:${transaction.key}:${socket.id}`,
					store,
				)
				unsubscribeFunctions.push(unsubscribeFromTransaction)
			}
		}
		socket.off(`get:${continuityKey}`, sendInitialPayload)
		socket.on(`get:${continuityKey}`, sendInitialPayload)

		const fillTransactionRequest = (
			update: Pick<AtomIO.TransactionUpdate<JsonIO>, `id` | `key` | `params`>,
		) => {
			const transactionKey = update.key
			const updateId = update.id
			const performanceKey = `tx-run:${transactionKey}:${updateId}`
			const performanceKeyStart = `${performanceKey}:start`
			const performanceKeyEnd = `${performanceKey}:end`
			performance.mark(performanceKeyStart)
			actUponStore(
				{ type: `transaction`, key: transactionKey },
				updateId,
				store,
			)(...update.params)
			performance.mark(performanceKeyEnd)
			const metric = performance.measure(
				performanceKey,
				performanceKeyStart,
				performanceKeyEnd,
			)
			store?.logger.info(
				`🚀`,
				`transaction`,
				transactionKey,
				updateId,
				metric.duration,
			)
		}
		socket.off(`tx-run:${continuityKey}`, fillTransactionRequest)
		socket.on(`tx-run:${continuityKey}`, fillTransactionRequest)

		let i = 1
		let next = 1
		const retry = setInterval(() => {
			const toEmit = socketUnacknowledgedUpdates[0]
			console.log(userKey, socketUnacknowledgedUpdates)
			if (toEmit && i === next) {
				socket.emit(`tx-new:${continuityKey}`, toEmit as Json.Serializable)
				next *= 2
			}

			i++
		}, 250)
		const trackClientAcknowledgement = (epoch: number) => {
			i = 1
			next = 1
			const socketEpochState = findInStore(
				socketEpochSelectors,
				socket.id,
				store,
			)

			setIntoStore(socketEpochState, epoch, store)
			if (socketUnacknowledgedUpdates[0]?.epoch === epoch) {
				setIntoStore(
					socketUnacknowledgedQueue,
					(updates) => {
						updates.shift()
						return updates
					},
					store,
				)
			}
		}
		socket.off(`ack:${continuityKey}`, trackClientAcknowledgement)
		socket.on(`ack:${continuityKey}`, trackClientAcknowledgement)
		return () => {
			clearInterval(retry)
			for (const unsubscribe of unsubscribeFunctions) unsubscribe()
			socket.off(`ack:${continuityKey}`, trackClientAcknowledgement)
			socket.off(`get:${continuityKey}`, sendInitialPayload)
			socket.off(`tx-run:${continuityKey}`, fillTransactionRequest)
		}
	}
}
